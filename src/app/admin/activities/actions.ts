"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function createActivityNotice(formData: FormData) {
  const titleZh = String(formData.get("titleZh") || "").trim();

  if (!titleZh) {
    throw new Error("活动标题不能为空。");
  }

  await prisma.activityNotice.create({
    data: {
      titleZh,
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      summaryEn: String(formData.get("summaryEn") || "").trim() || null,
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      locationZh: String(formData.get("locationZh") || "").trim() || null,
      locationEn: String(formData.get("locationEn") || "").trim() || null,
      externalUrl: String(formData.get("externalUrl") || "").trim() || null,
      startAt: formData.get("startAt") ? new Date(String(formData.get("startAt"))) : null,
      endAt: formData.get("endAt") ? new Date(String(formData.get("endAt"))) : null
    }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function updateActivityNotice(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.activityNotice.update({
    where: { id },
    data: {
      titleZh: String(formData.get("titleZh") || "").trim(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      summaryEn: String(formData.get("summaryEn") || "").trim() || null,
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      locationZh: String(formData.get("locationZh") || "").trim() || null,
      locationEn: String(formData.get("locationEn") || "").trim() || null,
      externalUrl: String(formData.get("externalUrl") || "").trim() || null,
      startAt: formData.get("startAt") ? new Date(String(formData.get("startAt"))) : null,
      endAt: formData.get("endAt") ? new Date(String(formData.get("endAt"))) : null
    }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function setActivityNoticeStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.activityNotice.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function deleteActivityNotice(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.activityNotice.delete({ where: { id } });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}
