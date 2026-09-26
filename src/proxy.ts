import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "farnas_session";
const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || "farnas-dev-secret-change-me-please-0A1E4A"
);

const ROLE_HOME: Record<string, string> = {
  ADMIN: "/dashboard",
  ACCOUNTANT: "/receipts",
  SUPERVISOR: "/supervisor",
};

const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  ADMIN: [],
  ACCOUNTANT: [
    "/receipts",
    "/payroll",
    "/employees",
    "/expenses",
    "/commitments",
    "/company-documents",
    "/clients",
    "/contracts",
  ],
  SUPERVISOR: ["/supervisor", "/statement-requests"],
};

function isAllowed(role: string, pathname: string): boolean {
  if (role === "ADMIN") return true;
  const allowed = ROLE_ALLOWED_PREFIXES[role] || [];
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/logo") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  let role = "";
  try {
    const { payload } = await jwtVerify(token, secretKey);
    role = (payload.role as string) || "";
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (pathname === "/") {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  if (!isAllowed(role, pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = ROLE_HOME[role] || "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/(?!auth)|_next/static|_next/image).*)"],
};
