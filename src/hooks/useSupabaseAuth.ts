import { useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';

export function useSupabaseAuth() {
  const setAuthSession = useSessionStore((state) => state.setAuthSession);
  const markHydrated = useSessionStore((state) => state.markHydrated);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setAuthSession(data.session);
      markHydrated();
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
      markHydrated();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [markHydrated, setAuthSession]);
}
