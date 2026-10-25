import { cookies } from "next/headers";

export const ANON_COOKIE = "viva_anon";

export async function getAnonId() {
  const jar = await cookies();
  return jar.get(ANON_COOKIE)?.value ?? null;
}

export async function ensureAnonId() {
  const jar = await cookies();
  const existing = jar.get(ANON_COOKIE)?.value;
  if (existing) return existing;

  const id = crypto.randomUUID();
  jar.set(ANON_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return id;
}
