import { createBrowserClient } from '@supabase/ssr'
import { getSupabasePublicConfig } from './config'

/** Browser / client component Supabase client. Session is stored in cookies. */
export function createClient() {
  const { url, anonKey } = getSupabasePublicConfig()
  return createBrowserClient(url, anonKey)
}
