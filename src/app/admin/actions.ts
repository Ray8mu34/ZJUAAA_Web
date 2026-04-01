"use server";

import { signOut } from "@/lib/auth";

export async function adminSignOut() {
  await signOut({
    redirectTo: "/admin/login"
  });
}
