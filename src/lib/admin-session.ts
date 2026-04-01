import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();

  if (session) {
    return session;
  }

  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "/admin";
  const search = headerStore.get("x-search") || "";
  const callbackUrl = `${pathname}${search}`;

  redirect(`/admin/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
