"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { assertAdminPasswordLength, assertCanDisableAdmin } from "@/lib/admin-security";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { signOut } from "@/lib/auth";
import { logAdminAction } from "@/lib/audit-log";

export async function createAdminUser(formData: FormData) {
  const session = await requireAdminSession();

  const username = String(formData.get("username") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !displayName || !password) {
    throw new Error("用户名、显示名和密码不能为空。");
  }

  assertAdminPasswordLength(password);

  const existing = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (existing) {
    throw new Error("该用户名已经存在。");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.create({
    data: {
      username,
      displayName,
      passwordHash,
      status: "ACTIVE"
    }
  });

  await logAdminAction({
    action: "admin.create",
    actor: session.user,
    target: admin.id,
    metadata: { username: admin.username, displayName: admin.displayName }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}

export async function updateAdminProfile(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const displayName = String(formData.get("displayName") || "").trim();

  if (!id || !displayName) {
    throw new Error("参数不完整。");
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { displayName }
  });

  await logAdminAction({
    action: "admin.update-profile",
    actor: session.user,
    target: admin.id,
    metadata: { username: admin.username, displayName: admin.displayName }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}

export async function resetAdminPassword(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");

  if (!id || !password) {
    throw new Error("请填写新密码。");
  }

  assertAdminPasswordLength(password);

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { passwordHash }
  });

  await logAdminAction({
    action: "admin.reset-password",
    actor: session.user,
    target: admin.id,
    metadata: {
      username: admin.username,
      selfReset: session.user.id === id
    }
  });

  revalidatePath("/admin/admins");

  if (session.user.id === id) {
    await signOut({
      redirectTo: "/admin/login"
    });
  }
}

export async function setAdminStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "ACTIVE") as "ACTIVE" | "DISABLED";

  if (!id) {
    throw new Error("缺少管理员 ID。");
  }

  if (status === "DISABLED") {
    const [targetAdmin, activeAdminCount] = await prisma.$transaction([
      prisma.adminUser.findUnique({ where: { id } }),
      prisma.adminUser.count({ where: { status: "ACTIVE" } })
    ]);

    assertCanDisableAdmin({
      activeAdminCount,
      currentAdminId: session.user.id,
      targetAdmin
    });
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "admin.set-status",
    actor: session.user,
    target: admin.id,
    metadata: { username: admin.username, status: admin.status }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}
