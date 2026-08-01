import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

/**
 * Single Supabase client instance shared across the application
 * This prevents "Multiple GoTrueClient instances detected" warnings
 */
export const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
);
