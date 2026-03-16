import { NextRequest, NextResponse } from "next/server";

const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || "localhost:3000";

function getSubdomain(hostname: string): string | null {
  const baseDomain = APP_DOMAIN.split(":")[0];

  if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
    return null;
  }

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)
  ) {
    return null;
  }

  const parts = hostname.split(".");
  const baseParts = baseDomain.split(".");

  if (parts.length > baseParts.length) {
    return parts.slice(0, parts.length - baseParts.length).join(".");
  }

  return null;
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || APP_DOMAIN;
  const hostnameWithoutPort = hostname.split(":")[0];
  const subdomain = getSubdomain(hostnameWithoutPort);
  const { pathname } = request.nextUrl;

  // Skip internal Next.js paths and static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Dashboard: app.domain.com → rewrite to /dashboard/*
  if (subdomain === "app") {
    const url = request.nextUrl.clone();
    url.pathname = `/dashboard${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Business booking site: {slug}.domain.com → rewrite to /b/*
  if (subdomain && subdomain !== "www") {
    const url = request.nextUrl.clone();
    url.pathname = `/b${pathname === "/" ? "" : pathname}`;

    const response = NextResponse.rewrite(url);
    response.headers.set("x-business-slug", subdomain);
    return response;
  }

  // Root domain: no rewrite needed, serves /(marketing)/* pages
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
