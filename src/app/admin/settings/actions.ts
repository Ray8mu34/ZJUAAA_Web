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
      aboutIntroEn: String(formData.get("aboutIntroEn") || ""),
      academicDeptZh: String(formData.get("academicDeptZh") || ""),
      publicDeptZh: String(formData.get("publicDeptZh") || ""),
      mediaDeptZh: String(formData.get("mediaDeptZh") || ""),
      joinIntroZh: String(formData.get("joinIntroZh") || ""),
      joinBenefitsZh: String(formData.get("joinBenefitsZh") || ""),
      joinPosterNoteZh: String(formData.get("joinPosterNoteZh") || ""),
      alumniNamesZh: String(formData.get("alumniNamesZh") || "")
    }
  });

  revalidatePath("/about");
  revalidatePath("/join-us");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
}
