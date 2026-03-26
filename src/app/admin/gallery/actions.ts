"use server";

import { revalidatePath } from "next/cache";

import { createUniqueAstroPhotoSlug, generateDefaultAstroPhotoTitle } from "@/lib/astro-photo";
import { prisma } from "@/lib/db";

const DEFAULT_PHOTOGRAPHER = "天小协";

export async function createAstroPhoto(formData: FormData) {
  const rawTitle = String(formData.get("titleZh") || "").trim();
  const titleZh = rawTitle || generateDefaultAstroPhotoTitle();
  const photographer = String(formData.get("photographer") || "").trim() || DEFAULT_PHOTOGRAPHER;
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = await createUniqueAstroPhotoSlug(rawSlug || titleZh);

  await prisma.astroPhoto.create({
    data: {
      slug,
      titleZh,
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      photographer,
      imagePath: String(formData.get("imagePath") || "").trim() || null,
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      descriptionEn: String(formData.get("descriptionEn") || "").trim() || null,
      skyRegionZh: String(formData.get("skyRegionZh") || "").trim() || null,
      skyRegionEn: String(formData.get("skyRegionEn") || "").trim() || null,
      locationZh: String(formData.get("locationZh") || "").trim() || null,
      locationEn: String(formData.get("locationEn") || "").trim() || null,
      equipmentMainLens: String(formData.get("equipmentMainLens") || "").trim() || null,
      equipmentCamera: String(formData.get("equipmentCamera") || "").trim() || null,
      equipmentMount: String(formData.get("equipmentMount") || "").trim() || null,
      equipmentFilter: String(formData.get("equipmentFilter") || "").trim() || null,
      equipmentSoftware: String(formData.get("equipmentSoftware") || "").trim() || null,
      status: "PUBLISHED"
    }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function updateAstroPhoto(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.astroPhoto.update({
    where: { id },
    data: {
      titleZh: String(formData.get("titleZh") || "").trim() || generateDefaultAstroPhotoTitle(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      photographer: String(formData.get("photographer") || "").trim() || DEFAULT_PHOTOGRAPHER,
      imagePath: String(formData.get("imagePath") || "").trim() || null,
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      descriptionEn: String(formData.get("descriptionEn") || "").trim() || null,
      skyRegionZh: String(formData.get("skyRegionZh") || "").trim() || null,
      skyRegionEn: String(formData.get("skyRegionEn") || "").trim() || null,
      locationZh: String(formData.get("locationZh") || "").trim() || null,
      locationEn: String(formData.get("locationEn") || "").trim() || null,
      equipmentMainLens: String(formData.get("equipmentMainLens") || "").trim() || null,
      equipmentCamera: String(formData.get("equipmentCamera") || "").trim() || null,
      equipmentMount: String(formData.get("equipmentMount") || "").trim() || null,
      equipmentFilter: String(formData.get("equipmentFilter") || "").trim() || null,
      equipmentSoftware: String(formData.get("equipmentSoftware") || "").trim() || null
    }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/astrophotography/[slug]", "page");
  revalidatePath("/admin/gallery");
}

export async function setAstroPhotoStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.astroPhoto.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function deleteAstroPhoto(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.astroPhoto.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}
