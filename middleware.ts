// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  // protege somente /portal
  if (req.nextUrl.pathname.startsWith("/portal")) {
    const hasAuth =
      req.cookies.has("sb-access-token") || req.headers.get("authorization");
    if (!hasAuth) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*"],
};
