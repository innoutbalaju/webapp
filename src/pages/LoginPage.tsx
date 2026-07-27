import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';

import { EmptyState } from '@/components/EmptyState';
import { SectionCard } from '@/components/SectionCard';
import { getErrorMessage } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';

export default function LoginPage() {
  const authUser = useSessionStore((state) => state.authUser);
  const room = useSessionStore((state) => state.room);
  const role = useSessionStore((state) => state.role);
  const setRoom = useSessionStore((state) => state.setRoom);

  const [roomNumber, setRoomNumber] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const helperText = useMemo(() => {
    if (!authUser) {
      return 'Sign in with Google first, then verify the room number and four-digit check-in PIN.';
    }

    return `Signed in as ${authUser.email ?? authUser.id}. Complete the room check to unlock ordering.`;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      setRoom(null);
    }
  }, [authUser, setRoom]);

  if (role === 'admin') {
    return <Navigate to="/admin/orders" replace />;
  }

  if (authUser && room) {
    return <Navigate to="/menu" replace />;
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) {
      setErrorMessage(getErrorMessage(error));
    }
  }

  async function handleRoomBinding(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!authUser) {
      setErrorMessage('Please sign in with Google before entering your room PIN.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const { data, error } = await (supabase as typeof supabase & {
      rpc: (
        fn: 'bind_guest_room',
        args: {
          p_room_number: string;
          p_pin_code: string;
          p_google_id: string;
        },
      ) => ReturnType<typeof supabase.rpc>;
    }).rpc('bind_guest_room', {
      p_room_number: roomNumber.trim(),
      p_pin_code: pinCode.trim(),
      p_google_id: authUser.id,
    });

    setIsLoading(false);

    if (error) {
      setErrorMessage(getErrorMessage(error));
      return;
    }

    setRoom(data as typeof room);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setRoom(null);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(245,158,11,0.18),_transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/70 p-8 shadow-[0_30px_100px_rgba(15,23,42,0.55)]">
          <div className="flex items-center gap-3 text-amber-200">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-xs uppercase tracking-[0.28em]">
              Secure Room Service
            </span>
          </div>
          <h1 className="mt-5 font-serif text-4xl text-amber-50">
            Order from your room in minutes
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">{helperText}</p>
        </div>

        <SectionCard
          title="Step 1. Sign in with Google"
          description="The first successful room verification locks your current identity to the room until checkout."
          actions={
            authUser ? (
              <button
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-xs text-slate-200 transition hover:bg-white/5"
                onClick={handleLogout}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            ) : null
          }
        >
          <button
            className="w-full rounded-2xl bg-amber-300 px-5 py-4 text-sm font-medium text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={Boolean(authUser)}
            onClick={handleGoogleSignIn}
            type="button"
          >
            {authUser ? 'Google account already linked' : 'Continue with Google'}
          </button>
        </SectionCard>

        <SectionCard
          title="Step 2. Verify your room"
          description="Enter the room number and the four-digit PIN provided at check-in."
        >
          <form className="space-y-4" onSubmit={handleRoomBinding}>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                Room Number
              </span>
              <input
                className="w-full rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300"
                onChange={(event) => setRoomNumber(event.target.value)}
                placeholder="e.g. 504"
                value={roomNumber}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-slate-400">
                4-Digit PIN
              </span>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  className="w-full rounded-2xl border border-white/10 bg-slate-950/80 py-3 pl-11 pr-4 text-sm outline-none ring-0 transition placeholder:text-slate-500 focus:border-amber-300"
                  inputMode="numeric"
                  maxLength={4}
                  onChange={(event) => setPinCode(event.target.value)}
                  placeholder="0000"
                  value={pinCode}
                />
              </div>
            </label>
            {errorMessage ? (
              <p className="rounded-2xl bg-rose-500/15 px-4 py-3 text-sm text-rose-200 ring-1 ring-rose-400/30">
                {errorMessage}
              </p>
            ) : null}
            <button
              className="w-full rounded-2xl bg-slate-100 px-5 py-4 text-sm font-medium text-slate-950 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!authUser || !roomNumber || pinCode.length !== 4 || isLoading}
              type="submit"
            >
              {isLoading ? 'Verifying room...' : 'Unlock room service'}
            </button>
          </form>
        </SectionCard>

        <EmptyState
          title="Need help at reception?"
          description="If your PIN fails, the room is blocked, or you were checked out unexpectedly, contact the front desk to reset the room assignment."
        />
      </div>
    </main>
  );
}
