import { createClient } from '@supabase/supabase-js';

import { env, isSupabaseConfigured } from '@/lib/env';
import type { MenuItem, Order, Room } from '@/types/domain';

export type Database = {
  public: {
    Tables: {
      menu_items: {
        Row: MenuItem;
        Insert: {
          id?: string;
          title: string;
          category: MenuItem['category'];
          price: number;
          is_available?: boolean;
        };
        Update: Partial<{
          title: string;
          category: MenuItem['category'];
          price: number;
          is_available: boolean;
        }>;
      };
      orders: {
        Row: Order;
        Insert: {
          id?: string;
          room_number: string;
          items: Order['items'];
          total_price?: number;
          status?: Order['status'];
          created_at?: string;
        };
        Update: Partial<{
          room_number: string;
          items: Order['items'];
          total_price: number;
          status: Order['status'];
          created_at: string;
        }>;
      };
      rooms: {
        Row: Room;
        Insert: {
          id?: string;
          room_number: string;
          pin_code: string;
          assigned_google_id?: string | null;
          is_blocked?: boolean;
        };
        Update: Partial<{
          room_number: string;
          pin_code: string;
          assigned_google_id: string | null;
          is_blocked: boolean;
        }>;
      };
    };
    Functions: {
      bind_guest_room: {
        Args: {
          p_room_number: string;
          p_pin_code: string;
          p_google_id: string;
        };
        Returns: Room;
      };
    };
  };
};

const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackAnonKey = 'placeholder-anon-key';

export const supabase = createClient<Database>(
  isSupabaseConfigured() ? env.supabaseUrl : fallbackUrl,
  isSupabaseConfigured() ? env.supabaseAnonKey : fallbackAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
