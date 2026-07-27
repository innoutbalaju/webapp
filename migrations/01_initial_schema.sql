-- 01_initial_schema.sql
-- Initial schema for Hotel Room Service App

create extension if not exists pgcrypto;

-- 1. Tables
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  room_number text not null unique,
  pin_code text not null check (pin_code ~ '^[0-9]{4}$'),
  assigned_google_id text null,
  is_blocked boolean not null default false
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null check (category in ('Food', 'Beverage', 'Amenities')),
  price numeric(10,2) not null check (price >= 0),
  is_available boolean not null default true
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  room_number text not null references public.rooms(room_number) on update cascade,
  items jsonb not null,
  total_price numeric(10,2) not null default 0,
  status text not null default 'Pending' check (status in ('Pending', 'Printed', 'Preparing', 'Delivered', 'Completed', 'Canceled')),
  created_at timestamptz not null default now()
);

-- 2. Indexes
create index if not exists idx_orders_room_number_created_at
  on public.orders(room_number, created_at desc);

create index if not exists idx_orders_status_created_at
  on public.orders(status, created_at desc);

create index if not exists idx_menu_items_available_category
  on public.menu_items(is_available, category);

-- 3. Helper Functions
create or replace function public.current_google_subject()
returns text
language sql
stable
as $$
  select coalesce(auth.jwt() ->> 'sub', '');
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

-- 4. Guest Room Verification Function
create or replace function public.bind_guest_room(
  p_room_number text,
  p_pin_code text,
  p_google_id text
)
returns public.rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.rooms;
begin
  select *
  into v_room
  from public.rooms
  where room_number = p_room_number
    and pin_code = p_pin_code
  for update;

  if not found then
    raise exception 'Invalid room number or PIN';
  end if;

  if v_room.is_blocked then
    raise exception 'Room is blocked';
  end if;

  if v_room.assigned_google_id is null then
    update public.rooms
    set assigned_google_id = p_google_id
    where id = v_room.id
    returning * into v_room;
  elsif v_room.assigned_google_id <> p_google_id then
    raise exception 'Room is already assigned to a different guest';
  end if;

  return v_room;
end;
$$;

-- 5. Pricing And Validation Trigger
create or replace function public.compute_order_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_google_id text;
  v_room public.rooms;
  v_total numeric(10,2);
  v_item_count integer;
begin
  v_google_id := public.current_google_subject();

  select *
  into v_room
  from public.rooms
  where room_number = new.room_number;

  if not found then
    raise exception 'Room does not exist';
  end if;

  if v_room.is_blocked then
    raise exception 'Room is blocked';
  end if;

  if coalesce(v_room.assigned_google_id, '') <> v_google_id then
    raise exception 'Room assignment mismatch';
  end if;

  select coalesce(sum((item.value ->> 'quantity')::int), 0)
  into v_item_count
  from jsonb_array_elements(new.items) as item(value);

  if v_item_count <= 0 or v_item_count > 5 then
    raise exception 'Orders must contain between 1 and 5 total item units';
  end if;

  if exists (
    select 1
    from public.orders o
    where o.room_number = new.room_number
      and o.created_at > now() - interval '10 minutes'
      and o.status <> 'Canceled'
  ) then
    raise exception 'Rate limit exceeded for room';
  end if;

  with order_items as (
    select
      (item.value ->> 'item_id')::uuid as item_id,
      (item.value ->> 'quantity')::int as quantity
    from jsonb_array_elements(new.items) as item(value)
  )
  select sum(mi.price * oi.quantity)
  into v_total
  from order_items oi
  join public.menu_items mi on mi.id = oi.item_id
  where mi.is_available = true;

  if v_total is null then
    raise exception 'Order contains unavailable or invalid items';
  end if;

  if (
    select count(*)
    from (
      select 1
      from jsonb_array_elements(new.items) as item(value)
      left join public.menu_items mi
        on mi.id = ((item.value ->> 'item_id')::uuid)
       and mi.is_available = true
      where mi.id is null
    ) invalid_items
  ) > 0 then
    raise exception 'Order contains unavailable or invalid items';
  end if;

  new.total_price := v_total;
  new.status := coalesce(new.status, 'Pending');
  return new;
end;
$$;

drop trigger if exists trg_compute_order_total on public.orders;

create trigger trg_compute_order_total
before insert on public.orders
for each row
execute function public.compute_order_total();

-- 6. RLS Policies
alter table public.rooms enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;

drop policy if exists "admins_manage_rooms" on public.rooms;
create policy "admins_manage_rooms"
on public.rooms
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "guest_read_own_room" on public.rooms;
create policy "guest_read_own_room"
on public.rooms
for select
to authenticated
using (assigned_google_id = public.current_google_subject());

drop policy if exists "admins_manage_menu_items" on public.menu_items;
create policy "admins_manage_menu_items"
on public.menu_items
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "guests_read_available_menu_items" on public.menu_items;
create policy "guests_read_available_menu_items"
on public.menu_items
for select
to authenticated
using (is_available = true);

drop policy if exists "admins_manage_orders" on public.orders;
create policy "admins_manage_orders"
on public.orders
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "guests_insert_own_orders" on public.orders;
create policy "guests_insert_own_orders"
on public.orders
for insert
to authenticated
with check (
  exists (
    select 1
    from public.rooms r
    where r.room_number = orders.room_number
      and r.assigned_google_id = public.current_google_subject()
      and r.is_blocked = false
  )
);

drop policy if exists "guests_read_own_orders" on public.orders;
create policy "guests_read_own_orders"
on public.orders
for select
to authenticated
using (
  exists (
    select 1
    from public.rooms r
    where r.room_number = orders.room_number
      and r.assigned_google_id = public.current_google_subject()
  )
);
