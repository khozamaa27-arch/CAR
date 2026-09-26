import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

export type Role = "ADMIN" | "ACCOUNTANT" | "SUPERVISOR";

export interface SessionPayload {
  sub: string;
  name: string;
  email: string;
  role: Role;
  [key: string]: unknown;
}

const COOKIE_NAME = "farnas_session";
const secretKey = new TextEncoder().encode(
  process.env.SESSION_SECRET || "farnas-dev-secret-change-me-please-0A1E4A"
);

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey);
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

/** خريطة صلاحيات الوصول لكل دور حسب بادئة المسار (بدون لوحة الإدارة وأرقام الربح للمشرف) */
export const ROLE_ALLOWED_PREFIXES: Record<Role, string[]> = {
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

export const ROLE_HOME: Record<Role, string> = {
  ADMIN: "/dashboard",
  ACCOUNTANT: "/receipts",
  SUPERVISOR: "/supervisor",
};

export function isPathAllowed(role: Role, pathname: string): boolean {
  if (role === "ADMIN") return true;
  const allowed = ROLE_ALLOWED_PREFIXES[role];
  return allowed.some((p) => pathname === p || pathname.startsWith(p + "/"));
}
