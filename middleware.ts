import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(request) {
    if (
      request.nextauth.token &&
      request.nextUrl.pathname === "/" &&
      !request.nextUrl.searchParams.has("callbackUrl")
    ) {
      return NextResponse.next();
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => Boolean(token),
    },
    pages: {
      signIn: "/login",
    },
  },
);

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|manifest.json|icons|login).*)",
  ],
};
