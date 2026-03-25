import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client with realtime capabilities for the web
 * This client should be used for listening to realtime updates
 */
export const createRealtimeSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
      realtime: {
        params: {
          eventspersecond: 10,
        },
      },
    }
  );
};