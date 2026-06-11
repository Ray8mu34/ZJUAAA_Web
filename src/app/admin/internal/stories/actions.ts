"use server";

import { revalidatePath } from "next/cache";

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
  await prisma.internalStory.create({
    data: {
      ...getStoryData(formData),
      status: "PUBLISHED"
    }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}

export async function updateInternalStory(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.internalStory.update({
    where: { id },
    data: getStoryData(formData)
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
}

export async function setInternalStoryStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.internalStory.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}

export async function deleteInternalStory(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.internalStory.delete({ where: { id } });

  revalidatePath("/admin/internal/stories");
  revalidatePath("/internal/stories");
  revalidatePath("/internal");
}
