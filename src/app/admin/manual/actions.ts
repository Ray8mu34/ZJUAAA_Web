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

export async function createManualChapter(formData: FormData) {
  const titleZh = String(formData.get("titleZh") || "").trim();
  const chapterNo = String(formData.get("chapterNo") || "").trim();
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!titleZh || !chapterNo || !categoryId) {
    throw new Error("栏目、章节编号和中文标题不能为空。");
  }

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `manual-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.manualChapter.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  await prisma.manualChapter.create({
    data: {
      slug,
      categoryId,
      chapterNo,
      titleZh,
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      author: String(formData.get("author") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      sortOrder: Number(formData.get("sortOrder") || 0)
    }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
}

export async function updateManualChapter(formData: FormData) {
  const id = String(formData.get("id") || "");
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!categoryId) {
    throw new Error("请选择所属栏目。");
  }

  await prisma.manualChapter.update({
    where: { id },
    data: {
      categoryId,
      chapterNo: String(formData.get("chapterNo") || "").trim(),
      titleZh: String(formData.get("titleZh") || "").trim(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      author: String(formData.get("author") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      sortOrder: Number(formData.get("sortOrder") || 0)
    }
  });

  revalidatePath("/manual");
  revalidatePath("/manual/[category]", "page");
  revalidatePath("/manual/[category]/[chapter]", "page");
  revalidatePath("/admin/manual");
}

export async function setManualChapterStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.manualChapter.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
}

export async function deleteManualChapter(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.manualChapter.delete({
    where: { id }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
}
