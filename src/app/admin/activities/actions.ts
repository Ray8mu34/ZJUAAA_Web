"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";

export async function createActivityNotice(formData: FormData) {
  const session = await requireAdminSession();

  const titleZh = String(formData.get("titleZh") || "").trim();

  if (!titleZh) {
    throw new Error("活动标题不能为空。");
  }

  const activity = await prisma.activityNotice.create({
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

  await logAdminAction({
    action: "activity.create",
    actor: session.user,
    target: activity.id,
    metadata: { titleZh: activity.titleZh }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function updateActivityNotice(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const activity = await prisma.activityNotice.update({
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

  await logAdminAction({
    action: "activity.update",
    actor: session.user,
    target: activity.id,
    metadata: { titleZh: activity.titleZh }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function setActivityNoticeStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const activity = await prisma.activityNotice.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "activity.set-status",
    actor: session.user,
    target: activity.id,
    metadata: { titleZh: activity.titleZh, status: activity.status }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}

export async function deleteActivityNotice(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const activity = await prisma.activityNotice.delete({ where: { id } });

  await logAdminAction({
    action: "activity.delete",
    actor: session.user,
    target: activity.id,
    metadata: { titleZh: activity.titleZh }
  });

  revalidatePath("/activities");
  revalidatePath("/admin/activities");
  revalidatePath("/");
}
