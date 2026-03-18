"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createAstroPhoto(formData: FormData) {
  const titleZh = String(formData.get("titleZh") || "").trim();
  const photographer = String(formData.get("photographer") || "").trim();

  if (!titleZh || !photographer) {
    throw new Error("作品标题和拍摄者不能为空。");
  }

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `astro-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.astroPhoto.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

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
      equipmentSoftware: String(formData.get("equipmentSoftware") || "").trim() || null
    }
  });

  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function updateAstroPhoto(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.astroPhoto.update({
    where: { id },
    data: {
      titleZh: String(formData.get("titleZh") || "").trim(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      photographer: String(formData.get("photographer") || "").trim(),
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

  revalidatePath("/astrophotography");
  revalidatePath("/astrophotography/[slug]", "page");
  revalidatePath("/admin/gallery");
}

export async function setAstroPhotoStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.astroPhoto.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function deleteAstroPhoto(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.astroPhoto.delete({ where: { id } });

  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}
