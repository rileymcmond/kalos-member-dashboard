import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabasePublicConfig } from './config'

/**
 * Server Components, Route Handlers, and Server Actions: call from async context.
 * Refreshes the session (middleware also runs refresh; both are safe with @supabase/ssr).
 */
export async function createClient() {
  const { url, anonKey } = getSupabasePublicConfig()
  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        // Cache-busting headers must be on the real HTTP response; RSC often cannot set them.
        _responseHeaders: Record<string, string>
      ) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // setAll from a Server Component — session refresh happens in middleware.
        }
      },
    },
  })
}
