import { createBrowserClient } from '@supabase/ssr'

export const createClient = () => {
  // During build time, these might be undefined. 
  // We provide placeholders so createBrowserClient doesn't throw an error.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

  return createBrowserClient(supabaseUrl, supabaseKey);
}