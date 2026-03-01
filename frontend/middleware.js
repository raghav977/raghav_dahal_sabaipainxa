import { NextResponse } from "next/server";

export function middleware(request) {
  if (request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login"],
};
