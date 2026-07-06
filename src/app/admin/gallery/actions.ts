"use server";

import { revalidatePath } from "next/cache";

import { createUniqueAstroPhotoSlug, generateDefaultAstroPhotoTitle } from "@/lib/astro-photo";
import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";

const DEFAULT_PHOTOGRAPHER = "天小协";

export async function createAstroPhoto(formData: FormData) {
  const session = await requireAdminSession();

  const rawTitle = String(formData.get("titleZh") || "").trim();
  const titleZh = rawTitle || generateDefaultAstroPhotoTitle();
  const photographer = String(formData.get("photographer") || "").trim() || DEFAULT_PHOTOGRAPHER;
  const rawSlug = String(formData.get("slug") || "").trim();
  const slug = await createUniqueAstroPhotoSlug(rawSlug || titleZh);

  const photo = await prisma.astroPhoto.create({
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

  await logAdminAction({
    action: "astro-photo.create",
    actor: session.user,
    target: photo.id,
    metadata: { titleZh: photo.titleZh, slug: photo.slug, imagePath: photo.imagePath }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function updateAstroPhoto(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const photo = await prisma.astroPhoto.update({
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

  await logAdminAction({
    action: "astro-photo.update",
    actor: session.user,
    target: photo.id,
    metadata: { titleZh: photo.titleZh, slug: photo.slug, imagePath: photo.imagePath }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/astrophotography/[slug]", "page");
  revalidatePath("/admin/gallery");
}

export async function setAstroPhotoStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const photo = await prisma.astroPhoto.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "astro-photo.set-status",
    actor: session.user,
    target: photo.id,
    metadata: { titleZh: photo.titleZh, slug: photo.slug, status: photo.status }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}

export async function deleteAstroPhoto(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const photo = await prisma.astroPhoto.delete({ where: { id } });

  await logAdminAction({
    action: "astro-photo.delete",
    actor: session.user,
    target: photo.id,
    metadata: { titleZh: photo.titleZh, slug: photo.slug, imagePath: photo.imagePath }
  });

  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/admin/gallery");
}
