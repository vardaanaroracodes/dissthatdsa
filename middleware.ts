// Middleware to protect admin routes
// Redirects to login if not authenticated

export { auth as middleware } from "@/auth"

export const config = {
  matcher: ['/admin/dashboard/:path*']
}
