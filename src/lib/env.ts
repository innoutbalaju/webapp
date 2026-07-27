export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? '',
  hotelName: import.meta.env.VITE_HOTEL_NAME ?? 'Aurora Grand Hotel',
  adminSupportEmail:
    import.meta.env.VITE_ADMIN_SUPPORT_EMAIL ?? 'reception@example.com',
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
