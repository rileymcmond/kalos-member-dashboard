/** Unauthenticated users may access these pathnames only. */
export const publicPathnames = new Set<string>(['/login', '/register'])

export function isAuthPagePathname(pathname: string): boolean {
  return publicPathnames.has(pathname)
}

export function isSafeRedirectPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false
  if (path.match(/^\/auth\//)) return false
  return !path.match(/^\/login|^\/register/)
}
