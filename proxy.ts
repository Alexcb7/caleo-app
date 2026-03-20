import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
                     request.nextUrl.pathname.startsWith("/register");
  const isDashboard = request.nextUrl.pathname.startsWith("/home") ||
                      request.nextUrl.pathname.startsWith("/compra") ||
                      request.nextUrl.pathname.startsWith("/mis-compras") ||
                      request.nextUrl.pathname.startsWith("/mis-listas") ||
                      request.nextUrl.pathname.startsWith("/chat") ||
                      request.nextUrl.pathname.startsWith("/ofertas") ||
                      request.nextUrl.pathname.startsWith("/ajustes");

  if (isDashboard && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/home/:path*", "/compra/:path*", "/mis-compras/:path*", "/mis-listas/:path*", "/chat/:path*", "/ofertas/:path*", "/ajustes/:path*", "/login", "/register"],
};