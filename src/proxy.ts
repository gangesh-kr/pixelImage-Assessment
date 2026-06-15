import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";

const authMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => !!token,
  },
  pages: {
    signIn: "/login",
  },
});

export function proxy(request: NextRequest) {
  return (authMiddleware as (req: NextRequest) => Promise<unknown>)(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/websites/:path*",
    "/issues/:path*",
    "/notifications/:path*",
  ],
};
