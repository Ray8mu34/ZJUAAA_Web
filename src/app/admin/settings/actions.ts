"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";

export async function updateSecondaryContent(formData: FormData) {
  const session = await requireAdminSession();

  const setting = await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {
      contactEmail: String(formData.get("contactEmail") || "").trim(),
      aboutIntroZh: String(formData.get("aboutIntroZh") || "").trim(),
      knowledgeIntroZh: String(formData.get("knowledgeIntroZh") || "").trim(),
      activitiesIntroZh: String(formData.get("activitiesIntroZh") || "").trim(),
      galleryIntroZh: String(formData.get("galleryIntroZh") || "").trim(),
      manualIntroZh: String(formData.get("manualIntroZh") || "").trim(),
      internalIntroZh: String(formData.get("internalIntroZh") || "").trim(),
      contactIntroZh: String(formData.get("contactIntroZh") || "").trim(),
      aboutGalleryImagePaths: String(formData.get("aboutGalleryImagePaths") || "")
    }
  });

  await logAdminAction({
    action: "secondary-content.update",
    actor: session.user,
    target: setting.id,
    metadata: {
      contactEmail: setting.contactEmail,
      aboutGalleryImageCount: setting.aboutGalleryImagePaths
        ? setting.aboutGalleryImagePaths.split(/\r?\n/).filter(Boolean).length
        : 0
    }
  });

  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/join-us");
  revalidatePath("/knowledge");
  revalidatePath("/activities");
  revalidatePath("/astrophotography");
  revalidatePath("/manual");
  revalidatePath("/internal");
  revalidatePath("/admin/settings");
}

export async function updateAlumniGroups(formData: FormData) {
  const session = await requireAdminSession();
  const alumniGroupsJson = String(formData.get("alumniGroupsJson") || "[]");
  let parsed: unknown;
  try { parsed = JSON.parse(alumniGroupsJson); } catch { throw new Error("成员名单数据格式无效。"); }
  if (!Array.isArray(parsed)) throw new Error("成员名单数据格式无效。");

  const setting = await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site", alumniGroupsJson },
    update: { alumniGroupsJson }
  });
  await logAdminAction({
    action: "alumni-groups.update",
    actor: session.user,
    target: setting.id,
    metadata: { groupCount: parsed.length }
  });
  revalidatePath("/about/members");
  revalidatePath("/admin/alumni");
}
