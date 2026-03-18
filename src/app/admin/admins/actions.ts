"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function createAdminUser(formData: FormData) {
  const username = String(formData.get("username") || "").trim();
  const displayName = String(formData.get("displayName") || "").trim();
  const password = String(formData.get("password") || "");

  if (!username || !displayName || !password) {
    throw new Error("用户名、显示名和密码不能为空。");
  }

  const existing = await prisma.adminUser.findUnique({
    where: { username }
  });

  if (existing) {
    throw new Error("该用户名已经存在。");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.create({
    data: {
      username,
      displayName,
      passwordHash,
      status: "ACTIVE"
    }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}

export async function updateAdminProfile(formData: FormData) {
  const id = String(formData.get("id") || "");
  const displayName = String(formData.get("displayName") || "").trim();

  if (!id || !displayName) {
    throw new Error("参数不完整。");
  }

  await prisma.adminUser.update({
    where: { id },
    data: { displayName }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}

export async function resetAdminPassword(formData: FormData) {
  const id = String(formData.get("id") || "");
  const password = String(formData.get("password") || "");

  if (!id || !password) {
    throw new Error("请填写新密码。");
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.adminUser.update({
    where: { id },
    data: { passwordHash }
  });

  revalidatePath("/admin/admins");
}

export async function setAdminStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "ACTIVE") as "ACTIVE" | "DISABLED";

  if (!id) {
    throw new Error("缺少管理员 ID。");
  }

  await prisma.adminUser.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/admins");
  revalidatePath("/admin");
}
