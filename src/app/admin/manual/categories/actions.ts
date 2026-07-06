"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function createManualCategory(formData: FormData) {
  const session = await requireAdminSession();

  const titleZh = String(formData.get("titleZh") || "").trim();

  if (!titleZh) {
    throw new Error("栏目标题不能为空。");
  }

  const rawSlug = String(formData.get("slug") || "").trim();
  const baseSlug = slugify(rawSlug || titleZh) || `category-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.manualCategory.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const maxSort = await prisma.manualCategory.aggregate({ _max: { sortOrder: true } });
  const nextSort = (maxSort._max.sortOrder ?? 0) + 1;

  const category = await prisma.manualCategory.create({
    data: {
      slug,
      titleZh,
      summaryZh: String(formData.get("summaryZh") || "").trim(),
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      sortOrder: Number(formData.get("sortOrder") || nextSort),
      isVisible: formData.get("isVisible") === "on"
    }
  });

  await logAdminAction({
    action: "manual-category.create",
    actor: session.user,
    target: category.id,
    metadata: { titleZh: category.titleZh, slug: category.slug, isVisible: category.isVisible }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/manual/categories");
}

export async function updateManualCategory(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const category = await prisma.manualCategory.update({
    where: { id },
    data: {
      titleZh: String(formData.get("titleZh") || "").trim(),
      summaryZh: String(formData.get("summaryZh") || "").trim(),
      coverImagePath: String(formData.get("coverImagePath") || "").trim() || null,
      sortOrder: Number(formData.get("sortOrder") || 0),
      isVisible: formData.get("isVisible") === "on"
    }
  });

  await logAdminAction({
    action: "manual-category.update",
    actor: session.user,
    target: category.id,
    metadata: { titleZh: category.titleZh, slug: category.slug, isVisible: category.isVisible }
  });

  revalidatePath("/manual");
  revalidatePath("/manual/[category]", "page");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/manual/categories");
}

export async function deleteManualCategory(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");

  const chapterCount = await prisma.manualChapter.count({ where: { categoryId: id } });
  if (chapterCount > 0) {
    throw new Error("该栏目下还有文章，请先删除或移走文章后再删除栏目。");
  }

  const category = await prisma.manualCategory.delete({ where: { id } });

  await logAdminAction({
    action: "manual-category.delete",
    actor: session.user,
    target: category.id,
    metadata: { titleZh: category.titleZh, slug: category.slug }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/manual/categories");
}

export async function toggleCategoryVisibility(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const isVisible = formData.get("isVisible") === "true";

  const category = await prisma.manualCategory.update({
    where: { id },
    data: { isVisible: !isVisible }
  });

  await logAdminAction({
    action: "manual-category.toggle-visibility",
    actor: session.user,
    target: category.id,
    metadata: { titleZh: category.titleZh, slug: category.slug, isVisible: category.isVisible }
  });

  revalidatePath("/manual");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/manual/categories");
}
