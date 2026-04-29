import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const DASHBOARD = ["/home", "/compra", "/mis-compras", "/mis-listas", "/ofertas", "/chat", "/ajustes"];
const AUTH_PAGES = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasAuth = request.cookies.has("caleo_auth");

  const isDashboard = DASHBOARD.some(p => pathname === p || pathname.startsWith(p + "/"));
  const isAuthPage = AUTH_PAGES.some(p => pathname === p || pathname.startsWith(p + "/"));

  // Sin cookie en ruta protegida → login
  if (isDashboard && !hasAuth) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Con cookie en login/register → home
  if (isAuthPage && hasAuth) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/home/:path*",
    "/compra/:path*",
    "/mis-compras/:path*",
    "/mis-listas/:path*",
    "/ofertas/:path*",
    "/chat/:path*",
    "/ajustes/:path*",
    "/login",
    "/register",
  ],
};
