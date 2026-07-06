"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getStoryData(formData: FormData) {
  const content = String(formData.get("content") || "").trim();

  if (!content) {
    throw new Error("请填写天协往事文本。");
  }

  return {
    title: String(formData.get("title") || "").trim() || null,
    content,
    source: String(formData.get("source") || "").trim() || null,
    sortOrder: parseSortOrder(formData.get("sortOrder"))
  };
}

export async function createInternalStory(formData: FormData) {
  const session = await requireAdminSession();

  const story = await prisma.internalStory.create({
    data: {
      ...getStoryData(formData),
      status: "PUBLISHED"
    }
  });

  await logAdminAction({
    action: "internal-story.create",
    actor: session.user,
    target: story.id,
    metadata: { title: story.title, source: story.source }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}

export async function updateInternalStory(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const story = await prisma.internalStory.update({
    where: { id },
    data: getStoryData(formData)
  });

  await logAdminAction({
    action: "internal-story.update",
    actor: session.user,
    target: story.id,
    metadata: { title: story.title, source: story.source }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
}

export async function setInternalStoryStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const story = await prisma.internalStory.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "internal-story.set-status",
    actor: session.user,
    target: story.id,
    metadata: { title: story.title, status: story.status }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}

export async function deleteInternalStory(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const story = await prisma.internalStory.delete({ where: { id } });

  await logAdminAction({
    action: "internal-story.delete",
    actor: session.user,
    target: story.id,
    metadata: { title: story.title, source: story.source }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}
