"use server";

import { redirect } from "next/navigation";

import { clearInternalSession, setInternalSession, verifyInternalCredentials } from "@/lib/internal-auth";

function normalizeCallback(value: FormDataEntryValue | null) {
  const callback = String(value || "/internal").trim();
  return callback.startsWith("/internal") ? callback : "/internal";
}

export async function internalSignIn(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const password = String(formData.get("password") || "");
  const callbackUrl = normalizeCallback(formData.get("callbackUrl"));
  const result = verifyInternalCredentials(username, password);

  if (!result.ok) {
    const error = result.reason === "missing-config" ? "config" : "invalid";
    redirect(`/internal?error=${error}&next=${encodeURIComponent(callbackUrl)}`);
  }

  await setInternalSession(username);
  redirect(callbackUrl);
}

export async function internalSignOut() {
  await clearInternalSession();
  redirect("/internal");
}
