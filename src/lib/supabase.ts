import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // Use fallbacks to prevent undefined errors during build/init
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  return createBrowserClient(url, anonKey);
}