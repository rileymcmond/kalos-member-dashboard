import 'server-only'

import { createClient } from '@/lib/supabase/server'

/**
 * Resolves the current user on the server. Always check the result before protected queries.
 */
export async function getServerUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    return { user: null, supabase }
  }
  return { user, supabase }
}
