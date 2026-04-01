"use server";

import { redirect } from "next/navigation";

import { signOut } from "@/lib/auth";
import { auth } from "@/lib/auth";

export async function adminSignOut() {
  const session = await auth();

  if (!session) {
    redirect("/admin/login");
  }

  await signOut({
    redirectTo: "/admin/login"
  });
}
