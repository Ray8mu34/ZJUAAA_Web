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
  const categoryId = String(formData.get("categoryId") || "").trim();

  if (!titleZh || !categoryId) {
    throw new Error("栏目和中文标题不能为空。");
  }

  const sortOrder = Number(formData.get("sortOrder") || 0);

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `manual-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.manualChapter.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  // 自动生成 chapterNo：如果 sortOrder > 0 则用 sortOrder，否则查询当前栏目最大序号 + 1
  let chapterNo: number;
  if (sortOrder > 0) {
    chapterNo = sortOrder;
  } else {
    const maxChapter = await prisma.manualChapter.aggregate({
      where: { categoryId },
      _max: { chapterNo: true }
    });
    chapterNo = (maxChapter._max.chapterNo ? Number(maxChapter._max.chapterNo) : 0) + 1;
  }

  await prisma.manualChapter.create({
    data: {
      slug,
      categoryId,
      chapterNo: String(chapterNo),
      titleZh,
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      author: String(formData.get("author") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      sortOrder: sortOrder || chapterNo
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

  const sortOrder = Number(formData.get("sortOrder") || 0);

  await prisma.manualChapter.update({
    where: { id },
    data: {
      categoryId,
      chapterNo: String(sortOrder || 1),
      titleZh: String(formData.get("titleZh") || "").trim(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      author: String(formData.get("author") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      sortOrder
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
