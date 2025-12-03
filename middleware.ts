// Middleware to protect admin routes
// Redirects to login if not authenticated or not approved

import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Check if accessing admin dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const session = req.auth

    // No session - redirect to login
    if (!session?.user) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }

    // Session exists but user not approved - redirect to login with error
    const user = session.user as any
    if (user.approved === false) {
      const url = new URL('/admin', req.url)
      url.searchParams.set('error', 'pending_approval')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/admin/dashboard/:path*']
}
