import type { PropsWithChildren, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BellRing, BookOpen, ReceiptText, ShoppingBag } from 'lucide-react';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

type GuestShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  headerAction?: ReactNode;
}>;

const navItems = [
  { to: '/menu', label: 'Menu', icon: ShoppingBag },
  { to: '/checkout', label: 'Checkout', icon: ReceiptText },
  { to: '/status', label: 'Status', icon: BellRing },
  { to: '/docs', label: 'Docs', icon: BookOpen },
];

export function GuestShell({
  title,
  subtitle,
  headerAction,
  children,
}: GuestShellProps) {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.16),_transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 pb-28 pt-6 text-slate-100">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
              {env.hotelName}
            </p>
            <h1 className="mt-3 font-serif text-3xl text-amber-50">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-300">{subtitle}</p>
          </div>
          {headerAction}
        </div>
        {children}
      </div>

      <nav className="fixed inset-x-4 bottom-4 z-30 mx-auto flex max-w-xl items-center justify-between rounded-full border border-white/10 bg-slate-950/90 px-4 py-3 shadow-[0_20px_60px_rgba(15,23,42,0.5)] backdrop-blur">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;

          return (
            <Link
              key={item.to}
              className={cn(
                'flex min-w-[88px] flex-col items-center gap-1 rounded-full px-4 py-2 text-xs transition',
                isActive
                  ? 'bg-amber-300 text-slate-950'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white',
              )}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </main>
  );
}
