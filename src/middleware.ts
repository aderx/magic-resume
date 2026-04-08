import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "@/i18n/compat/middleware";
import { routing } from "./i18n/routing.public";

const intlMiddleware = createMiddleware(routing);

const KNOWN_EXACT_PATHS = new Set([
  "/app",
  "/app/",
  "/app/dashboard",
  "/app/dashboard/",
  "/app/dashboard/resumes",
  "/app/dashboard/templates",
  "/app/dashboard/ai",
  "/app/dashboard/settings",
  "/zh",
  "/zh/",
  "/en",
  "/en/",
]);

const KNOWN_PREFIXES = [
  "/app/workbench/",
  "/app/preview-template/",
  "/api/",
  "/_next/",
];

const shouldBypass = (pathname: string) =>
  pathname === "/favicon.ico" ||
  pathname === "/robots.txt" ||
  pathname === "/sitemap.xml" ||
  /\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|map|txt|woff|woff2|ttf|otf)$/i.test(
    pathname
  );

const isKnownPath = (pathname: string) =>
  KNOWN_EXACT_PATHS.has(pathname) ||
  KNOWN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (shouldBypass(pathname)) {
    return intlMiddleware(request);
  }

  if (pathname === "/") {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  if (!isKnownPath(pathname)) {
    return NextResponse.redirect(new URL("/app/dashboard", request.url));
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
