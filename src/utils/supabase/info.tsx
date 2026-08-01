/* Supabase Configuration
 * This file supports both local development and production (Netlify) deployment
 * 
 * For LOCAL DEVELOPMENT: Uses hardcoded values below
 * For PRODUCTION (Netlify): Uses environment variables set in Netlify dashboard
 * 
 * In Netlify, set these environment variables:
 * - VITE_SUPABASE_URL (e.g., https://wnpvafxzxgafqtgcrbkc.supabase.co)
 * - VITE_SUPABASE_ANON_KEY (your public anon key)
 */

// Local development values (fallback)
const LOCAL_PROJECT_ID = "wnpvafxzxgafqtgcrbkc";
const LOCAL_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InducHZhZnh6eGdhZnF0Z2NyYmtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2MDczNDksImV4cCI6MjA3NzE4MzM0OX0.nCSh610GZLr5H_whDcjsAHQhpWE3hxMI4wmnRRPDK-U";

// Safely access environment variables (handles cases where import.meta.env might be undefined)
const getEnvVar = (key: string): string | undefined => {
  try {
    return import.meta?.env?.[key];
  } catch (error) {
    return undefined;
  }
};

// Production values (from environment variables)
// If VITE_SUPABASE_URL is set, extract project ID from it
// Otherwise, use local project ID
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
export const projectId = supabaseUrl 
  ? supabaseUrl.replace('https://', '').replace('.supabase.co', '')
  : LOCAL_PROJECT_ID;

// Use environment variable for anon key, or fall back to local value
export const publicAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || LOCAL_ANON_KEY;

// Log which environment we're using (helpful for debugging)
const isDev = getEnvVar('DEV');
if (isDev) {
  console.log('🔧 Running in DEVELOPMENT mode with local Supabase credentials');
} else if (supabaseUrl) {
  console.log('🚀 Running in PRODUCTION mode with environment variables');
} else {
  console.log('⚠️  Running in PRODUCTION mode but using local credentials (set environment variables in Netlify)');
}