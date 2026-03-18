"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

export async function updateSiteSettings(formData: FormData) {
  await prisma.siteSetting.upsert({
    where: { id: "site" },
    create: {
      id: "site"
    },
    update: {
      siteNameZh: String(formData.get("siteNameZh") || ""),
      siteNameEn: String(formData.get("siteNameEn") || ""),
      heroTitleZh: String(formData.get("heroTitleZh") || ""),
      heroTitleEn: String(formData.get("heroTitleEn") || ""),
      heroSubtitleZh: String(formData.get("heroSubtitleZh") || ""),
      heroSubtitleEn: String(formData.get("heroSubtitleEn") || ""),
      manifestoZh: String(formData.get("manifestoZh") || ""),
      manifestoEn: String(formData.get("manifestoEn") || ""),
      heroImagePath: String(formData.get("heroImagePath") || "").trim() || null,
      logoImagePath: String(formData.get("logoImagePath") || "").trim() || null,
      cardTheme: String(formData.get("cardTheme") || "dark"),
      primaryButtonZh: String(formData.get("primaryButtonZh") || ""),
      primaryButtonEn: String(formData.get("primaryButtonEn") || ""),
      primaryButtonHref: String(formData.get("primaryButtonHref") || "/about"),
      secondaryButtonZh: String(formData.get("secondaryButtonZh") || ""),
      secondaryButtonEn: String(formData.get("secondaryButtonEn") || ""),
      secondaryButtonHref: String(formData.get("secondaryButtonHref") || "/join-us"),
      joinFormUrl: String(formData.get("joinFormUrl") || ""),
      contactFormUrl: String(formData.get("contactFormUrl") || ""),
      bilibiliUrl: String(formData.get("bilibiliUrl") || ""),
      wechatLabel: String(formData.get("wechatLabel") || ""),
      qqLabel: String(formData.get("qqLabel") || ""),
      addressZh: String(formData.get("addressZh") || ""),
      addressEn: String(formData.get("addressEn") || "")
    }
  });

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/join-us");
  revalidatePath("/knowledge");
  revalidatePath("/activities");
  revalidatePath("/astrophotography");
  revalidatePath("/manual");
  revalidatePath("/manual/[chapter]", "page");
  revalidatePath("/admin/site");
  revalidatePath("/admin/settings");
}
