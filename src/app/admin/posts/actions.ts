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

export async function createKnowledgePost(formData: FormData) {
  const titleZh = String(formData.get("titleZh") || "").trim();
  const author = String(formData.get("author") || "").trim();

  if (!titleZh || !author) {
    throw new Error("标题和作者不能为空。");
  }

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `post-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.knowledgePost.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  await prisma.knowledgePost.create({
    data: {
      slug,
      titleZh,
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      summaryEn: String(formData.get("summaryEn") || "").trim() || null,
      author,
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      externalUrl: String(formData.get("externalUrl") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null
    }
  });

  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}

export async function updateKnowledgePost(formData: FormData) {
  const id = String(formData.get("id") || "");

  await prisma.knowledgePost.update({
    where: { id },
    data: {
      titleZh: String(formData.get("titleZh") || "").trim(),
      titleEn: String(formData.get("titleEn") || "").trim() || null,
      summaryZh: String(formData.get("summaryZh") || "").trim() || null,
      summaryEn: String(formData.get("summaryEn") || "").trim() || null,
      author: String(formData.get("author") || "").trim(),
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      externalUrl: String(formData.get("externalUrl") || "").trim() || null,
      markdownZh: String(formData.get("markdownZh") || ""),
      markdownEn: String(formData.get("markdownEn") || "").trim() || null
    }
  });

  revalidatePath("/knowledge");
  revalidatePath("/knowledge/[slug]", "page");
  revalidatePath("/admin/posts");
}

export async function setKnowledgePostStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.knowledgePost.update({
    where: { id },
    data: {
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null
    }
  });

  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}

export async function deleteKnowledgePost(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.knowledgePost.delete({ where: { id } });

  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}
