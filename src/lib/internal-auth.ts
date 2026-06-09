import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

const COOKIE_NAME = "zjuaaa-internal-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getInternalSecret() {
  return process.env.INTERNAL_AUTH_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
}

function getConfiguredCredentials() {
  const username = process.env.INTERNAL_USERNAME?.trim();
  const password = process.env.INTERNAL_PASSWORD?.trim();

  if (username && password) {
    return { username, password, configured: true };
  }

  if (process.env.NODE_ENV !== "production") {
    return {
      username: username || "member",
      password: password || "zjuaaa",
      configured: true
    };
  }

  return { username: "", password: "", configured: false };
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signPayload(payload: string) {
  const secret = getInternalSecret();
  if (!secret) return "";
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyInternalCredentials(username: string, password: string) {
  const credentials = getConfiguredCredentials();

  if (!credentials.configured) {
    return { ok: false, reason: "missing-config" as const };
  }

  if (!safeEqual(username, credentials.username) || !safeEqual(password, credentials.password)) {
    return { ok: false, reason: "invalid" as const };
  }

  return { ok: true, reason: null };
}

export function createInternalSessionToken(username: string) {
  const payload = Buffer.from(
    JSON.stringify({
      username,
      exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS
    })
  ).toString("base64url");
  const signature = signPayload(payload);

  return `${payload}.${signature}`;
}

export async function setInternalSession(username: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createInternalSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: "/internal"
  });
}

export async function clearInternalSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function hasInternalAccess() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const [payload, signature] = token.split(".");
  if (!payload || !signature || signPayload(payload) !== signature) {
    return false;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { exp?: number };
    return typeof data.exp === "number" && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function isInternalAuthConfigured() {
  return getConfiguredCredentials().configured;
}
