import { create } from 'zustand';
import type { Session, User } from '@supabase/supabase-js';

import type { Room, UserRole } from '@/types/domain';

type SessionState = {
  authSession: Session | null;
  authUser: User | null;
  room: Room | null;
  role: UserRole;
  isHydrated: boolean;
  setAuthSession: (session: Session | null) => void;
  setRoom: (room: Room | null) => void;
  setRole: (role: UserRole) => void;
  markHydrated: () => void;
  reset: () => void;
};

const initialState = {
  authSession: null,
  authUser: null,
  room: null,
  role: 'guest' as UserRole,
  isHydrated: false,
};

export const useSessionStore = create<SessionState>((set) => ({
  ...initialState,
  setAuthSession: (session) =>
    set({
      authSession: session,
      authUser: session?.user ?? null,
      role:
        session?.user?.app_metadata?.role === 'admin' ? 'admin' : 'guest',
    }),
  setRoom: (room) => set({ room }),
  setRole: (role) => set({ role }),
  markHydrated: () => set({ isHydrated: true }),
  reset: () => set({ ...initialState, isHydrated: true }),
}));
