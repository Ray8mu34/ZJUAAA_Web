import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

import type { Session } from "next-auth";

export async function getActiveSessionAdmin(session: Session | null) {
  const id = session?.user?.id;

  if (!id) {
    return null;
  }

  return prisma.adminUser.findFirst({
    where: { id, status: "ACTIVE" },
    select: { id: true, username: true, displayName: true }
  });
}

export async function requireAdminSession() {
  const session = await auth();
  const admin = await getActiveSessionAdmin(session);

  if (session && admin) {
    session.user.id = admin.id;
    session.user.username = admin.username;
    session.user.name = admin.displayName;
    return session;
  }

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "/admin";
  const search = headerStore.get("x-search") || "";
  const callbackUrl = `${pathname}${search}`;

  const reason = session ? "invalid-session" : "login-required";
  redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}&reason=${reason}`);
}
