import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { supabase } from '@/lib/supabase';
import { useSessionStore } from '@/store/sessionStore';
import type { Room } from '@/types/domain';

export function useGuestRoomGuard() {
  const navigate = useNavigate();
  const room = useSessionStore((state) => state.room);
  const setRoom = useSessionStore((state) => state.setRoom);

  useEffect(() => {
    if (!room?.id) {
      return;
    }

    const channel = supabase
      .channel(`room-guard-${room.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${room.id}`,
        },
        async (payload) => {
          const nextRoom = payload.new as Room | null;

          if (!nextRoom) {
            return;
          }

          if (nextRoom.is_blocked || nextRoom.assigned_google_id === null) {
            setRoom(null);
            await supabase.auth.signOut();
            navigate('/login', {
              replace: true,
              state: { reason: 'Your session has been closed by reception.' },
            });
            return;
          }

          setRoom(nextRoom);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [navigate, room?.id, setRoom]);
}
