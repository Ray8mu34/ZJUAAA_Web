"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function updateSecondaryContent(formData: FormData) {
  await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: { id: "site" },
    update: {
      contactEmail: String(formData.get("contactEmail") || ""),
      aboutIntroZh: String(formData.get("aboutIntroZh") || ""),
      academicDeptZh: String(formData.get("academicDeptZh") || ""),
      publicDeptZh: String(formData.get("publicDeptZh") || ""),
      mediaDeptZh: String(formData.get("mediaDeptZh") || ""),
      knowledgeIntroZh: String(formData.get("knowledgeIntroZh") || ""),
      activitiesIntroZh: String(formData.get("activitiesIntroZh") || ""),
      galleryIntroZh: String(formData.get("galleryIntroZh") || ""),
      manualIntroZh: String(formData.get("manualIntroZh") || ""),
      contactIntroZh: String(formData.get("contactIntroZh") || ""),
      aboutGalleryImagePaths: String(formData.get("aboutGalleryImagePaths") || ""),
      alumniGroupsJson: String(formData.get("alumniGroupsJson") || "")
    }
  });

  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/join-us");
  revalidatePath("/knowledge");
  revalidatePath("/activities");
  revalidatePath("/astrophotography");
  revalidatePath("/manual");
  revalidatePath("/admin/settings");
}
