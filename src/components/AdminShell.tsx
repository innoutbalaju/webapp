import type { PropsWithChildren, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, BookOpen, ClipboardList, ConciergeBell, KeyRound } from 'lucide-react';

import { env } from '@/lib/env';
import { cn } from '@/lib/utils';

type AdminShellProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  headerExtras?: ReactNode;
}>;

const navItems = [
  { to: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { to: '/admin/rooms', label: 'Rooms', icon: KeyRound },
  { to: '/admin/menu', label: 'Menu', icon: ConciergeBell },
  { to: '/admin/reports', label: 'Reports', icon: BarChart3 },
  { to: '/docs', label: 'Docs', icon: BookOpen },
];

export function AdminShell({
  title,
  subtitle,
  headerExtras,
  children,
}: AdminShellProps) {
  const location = useLocation();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-6 text-slate-100 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 grid gap-4 rounded-[32px] border border-white/10 bg-slate-950/70 p-6 shadow-[0_30px_100px_rgba(15,23,42,0.55)] md:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-amber-200/70">
              {env.hotelName}
            </p>
            <h1 className="mt-3 font-serif text-3xl text-amber-50">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              {subtitle}
            </p>
          </div>
          <div className="flex flex-col justify-between gap-4">
            <nav className="grid grid-cols-2 gap-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;

                return (
                  <Link
                    key={item.to}
                    className={cn(
                      'flex items-center gap-2 rounded-2xl px-4 py-3 text-sm transition',
                      isActive
                        ? 'bg-amber-300 text-slate-950'
                        : 'bg-white/5 text-slate-200 hover:bg-white/10',
                    )}
                    to={item.to}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            {headerExtras}
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}
