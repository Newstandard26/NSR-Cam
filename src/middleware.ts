import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const path = req.nextUrl.pathname

    // Force password change for newly-invited users (page nav only; let API calls through).
    if (token?.mustChangePassword && !path.startsWith("/api") && path !== "/change-password") {
      return NextResponse.redirect(new URL("/change-password", req.url))
    }
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  }
)

// Protect all app routes except auth pages, the auth API, and static assets.
export const config = {
  matcher: [
    "/((?!login|change-password|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
