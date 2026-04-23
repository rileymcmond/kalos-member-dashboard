import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { isAuthPagePathname, isSafeRedirectPath } from '@/lib/paths'
import { getSupabasePublicConfig } from './config'

/**
 * Refreshes the session on each matched request, then enforces:
 * - no session + protected route -> /login?next=...
 * - session + /login|/register -> /
 * Cookie changes from the Supabase client are copied onto any redirect so the session is preserved.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabasePublicConfig()
  const { pathname, search } = request.nextUrl

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: { name: string; value: string; options: CookieOptions }[],
        responseHeaders: Record<string, string>
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options)
        })
        Object.entries(responseHeaders).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value)
        })
      },
    },
  })

  // Do not add logic between createServerClient and getUser (Supabase doc).
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublic = isAuthPagePathname(pathname)

  if (!user && !isPublic) {
    const nextParam = isSafeRedirectPath(pathname + search) ? `${pathname}${search}` : undefined
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = nextParam
      ? `next=${encodeURIComponent(nextParam)}`
      : ''
    const redirectResponse = NextResponse.redirect(loginUrl)
    for (const c of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(c.name, c.value, c)
    }
    return redirectResponse
  }

  if (user && isPublic) {
    const appUrl = request.nextUrl.clone()
    appUrl.pathname = '/'
    appUrl.search = ''
    const redirectResponse = NextResponse.redirect(appUrl)
    for (const c of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(c.name, c.value, c)
    }
    return redirectResponse
  }

  return supabaseResponse
}
