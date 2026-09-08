"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { parseKnowledgePublishedAtInput } from "@/lib/knowledge-post-date";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function getIsFeatured(formData: FormData) {
  return formData.get("isFeatured") === "on";
}

async function getNextLeadingSortOrder() {
  const result = await prisma.knowledgePost.aggregate({
    _min: {
      sortOrder: true
    }
  });

  return (result._min.sortOrder ?? 0) - 1000;
}

function parsePostOrderIds(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return [...new Set(parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0))];
  } catch {
    return [];
  }
}

export async function createKnowledgePost(formData: FormData) {
  const session = await requireAdminSession();

  const titleZh = String(formData.get("titleZh") || "").trim();
  const author = String(formData.get("author") || "").trim();

  if (!titleZh || !author) {
    throw new Error("文章标题和作者不能为空。");
  }

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `post-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.knowledgePost.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const post = await prisma.knowledgePost.create({
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
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      isFeatured: getIsFeatured(formData),
      publishedAt: parseKnowledgePublishedAtInput(String(formData.get("publishedAt") || "")),
      sortOrder: await getNextLeadingSortOrder()
    }
  });

  await logAdminAction({
    action: "knowledge-post.create",
    actor: session.user,
    target: post.id,
    metadata: { titleZh: post.titleZh, slug: post.slug, isFeatured: post.isFeatured }
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}

export async function updateKnowledgePost(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const post = await prisma.knowledgePost.update({
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
      markdownEn: String(formData.get("markdownEn") || "").trim() || null,
      isFeatured: getIsFeatured(formData),
      publishedAt: parseKnowledgePublishedAtInput(String(formData.get("publishedAt") || ""))
    }
  });

  await logAdminAction({
    action: "knowledge-post.update",
    actor: session.user,
    target: post.id,
    metadata: { titleZh: post.titleZh, slug: post.slug, isFeatured: post.isFeatured }
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/knowledge/[slug]", "page");
  revalidatePath("/admin/posts");
}

export async function setKnowledgePostStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "DRAFT");

  if (status !== "DRAFT" && status !== "PUBLISHED" && status !== "ARCHIVED") {
    throw new Error("文章状态不正确。");
  }

  const existingPost = await prisma.knowledgePost.findUnique({
    where: { id },
    select: { publishedAt: true }
  });

  if (!existingPost) {
    throw new Error("没有找到这篇文章。");
  }

  const post = await prisma.knowledgePost.update({
    where: { id },
    data: {
      status,
      ...(status === "PUBLISHED" && !existingPost.publishedAt ? { publishedAt: new Date() } : {})
    }
  });

  await logAdminAction({
    action: "knowledge-post.set-status",
    actor: session.user,
    target: post.id,
    metadata: { titleZh: post.titleZh, slug: post.slug, status: post.status }
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}

export async function reorderKnowledgePosts(formData: FormData) {
  const session = await requireAdminSession();

  const ids = parsePostOrderIds(formData.get("ids"));

  if (ids.length < 2) {
    return;
  }

  await prisma.$transaction(
    ids.map((id, index) =>
      prisma.knowledgePost.update({
        where: { id },
        data: {
          sortOrder: index * 1000
        }
      })
    )
  );

  await logAdminAction({
    action: "knowledge-post.reorder",
    actor: session.user,
    metadata: { count: ids.length }
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}

export async function deleteKnowledgePost(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const post = await prisma.knowledgePost.delete({ where: { id } });

  await logAdminAction({
    action: "knowledge-post.delete",
    actor: session.user,
    target: post.id,
    metadata: { titleZh: post.titleZh, slug: post.slug }
  });

  revalidatePath("/");
  revalidatePath("/knowledge");
  revalidatePath("/admin/posts");
}
