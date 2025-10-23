// apps/web/src/middleware.ts
import { NextRequest, NextResponse } from "next/server";

const PROTECTED = [/^\/account(?:\/|$)/];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // tylko /account i podstrony
  if (!Promentioned(pathname)) return NextResponse.next();

  const token = req.cookies.get("bidcars_token")?.value;
  if (!token) {
    const url = new URL("/login", req.url);
    // ZAWSZE po zalogowaniu wracamy na stronę główną
    url.searchParams.set("next", "/");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

function Promentioned(pathname: string) {
  return PROTECTED.some((re) => re.test(pathname));
}

export const config = {
  matcher: ["/account", "/account/:path*"],
};
