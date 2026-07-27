import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Ban, KeyRound, LogOut, RotateCcw, Save } from 'lucide-react';

import { AdminShell } from '@/components/AdminShell';
import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { Room } from '@/types/domain';

function makePin() {
  return `${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function AdminRoomsPage() {
  const role = useSessionStore((state) => state.role);

  const [rooms, setRooms] = useState<Room[]>([]);
  const [pinDrafts, setPinDrafts] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    loadRooms();
  }, []);

  if (role !== 'admin') {
    return <Navigate replace to="/login" />;
  }

  async function loadRooms() {
    const { data, error } = await supabase
      .from('rooms')
      .select('*')
      .order('room_number');

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    const nextRooms = (data as Room[]) ?? [];
    setRooms(nextRooms);
    setPinDrafts(
      Object.fromEntries(nextRooms.map((room) => [room.id, room.pin_code])),
    );
  }

  async function patchRoom(roomId: string, patch: Partial<Room>) {
    const { error } = await (supabase.from('rooms') as any)
      .update(patch)
      .eq('id', roomId);

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    await loadRooms();
  }

  return (
    <AdminShell
      title="Room management"
      subtitle="Reset check-in PINs, block abusive rooms, and end guest sessions instantly by clearing the assigned identity."
    >
      {errorMessage ? (
        <div className="mb-5 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
          {errorMessage}
        </div>
      ) : null}

      {rooms.length === 0 ? (
        <EmptyState
          title="No rooms configured"
          description="Create room rows in Supabase so reception can bind guests and issue check-in PINs."
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {rooms.map((room) => (
            <SectionCard
              key={room.id}
              title={`Room ${room.room_number}`}
              description={
                room.assigned_google_id
                  ? `Bound to ${room.assigned_google_id}`
                  : 'Currently unassigned'
              }
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-3xl bg-white/5 px-4 py-3 text-sm">
                  <span className="text-slate-300">Status</span>
                  <span className={room.is_blocked ? 'text-rose-200' : 'text-emerald-200'}>
                    {room.is_blocked ? 'Blocked' : 'Active'}
                  </span>
                </div>

                <label className="block">
                  <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                    PIN code
                  </span>
                  <div className="flex gap-2">
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none focus:border-amber-300"
                      maxLength={4}
                      onChange={(event) =>
                        setPinDrafts((current) => ({
                          ...current,
                          [room.id]: event.target.value,
                        }))
                      }
                      value={pinDrafts[room.id] ?? ''}
                    />
                    <button
                      className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
                      onClick={() =>
                        setPinDrafts((current) => ({
                          ...current,
                          [room.id]: makePin(),
                        }))
                      }
                      type="button"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                </label>

                <div className="grid gap-2 md:grid-cols-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-amber-200"
                    onClick={() =>
                      patchRoom(room.id, { pin_code: pinDrafts[room.id] ?? room.pin_code })
                    }
                    type="button"
                  >
                    <Save className="h-4 w-4" />
                    Save PIN
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:bg-white/10"
                    onClick={() =>
                      patchRoom(room.id, { pin_code: makePin(), assigned_google_id: null })
                    }
                    type="button"
                  >
                    <KeyRound className="h-4 w-4" />
                    Reset PIN
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-500/15 px-4 py-3 text-sm text-sky-100 transition hover:bg-sky-500/25"
                    onClick={() => patchRoom(room.id, { assigned_google_id: null })}
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    Check Out Room
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-100 transition hover:bg-rose-500/25"
                    onClick={() => patchRoom(room.id, { is_blocked: !room.is_blocked })}
                    type="button"
                  >
                    <Ban className="h-4 w-4" />
                    {room.is_blocked ? 'Unblock Room' : 'Block Room'}
                  </button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
