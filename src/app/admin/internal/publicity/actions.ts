"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { createStoredFilename } from "@/lib/upload-names";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";
import { validateImageFile } from "@/lib/upload-validation";

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseDate(value: FormDataEntryValue | null) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const date = new Date(`${raw}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function savePublicityImage(file: File, title: string) {
  if (file.size <= 0) return null;

  const image = await validateImageFile(file, {
    label: "宣传部作品图片"
  });

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const outputName = createStoredFilename(image.originalName);
  const outputPath = path.join(uploadDir, outputName);
  const publicPath = getUploadPublicPath(outputName);

  await writeFile(outputPath, image.buffer);

  await prisma.mediaAsset.create({
    data: {
      title: title || file.name,
      category: "publicity",
      filePath: publicPath,
      mimeType: image.mimeType,
      altZh: title || null,
      altEn: null,
      fileSize: image.buffer.byteLength
    }
  });

  return publicPath;
}

export async function createPublicityWork(formData: FormData) {
  const session = await requireAdminSession();

  const title = String(formData.get("title") || "").trim() || "宣传部作品";
  const uploadedFile = formData.get("imageFile");
  const uploadedPath = uploadedFile instanceof File ? await savePublicityImage(uploadedFile, title) : null;
  const imagePath = uploadedPath || String(formData.get("imagePath") || "").trim();

  if (!imagePath) {
    throw new Error("请上传或选择一张作品图片。");
  }

  const work = await prisma.publicityWork.create({
    data: {
      title,
      imagePath,
      author: String(formData.get("author") || "").trim() || "天小协",
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      workDate: parseDate(formData.get("workDate")),
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      status: "PUBLISHED"
    }
  });

  await logAdminAction({
    action: "publicity-work.create",
    actor: session.user,
    target: work.id,
    metadata: { title: work.title, imagePath: work.imagePath, author: work.author }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function updatePublicityWork(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim() || "宣传部作品";
  const uploadedFile = formData.get("imageFile");
  const uploadedPath = uploadedFile instanceof File ? await savePublicityImage(uploadedFile, title) : null;
  const selectedPath = String(formData.get("imagePath") || "").trim();

  const work = await prisma.publicityWork.update({
    where: { id },
    data: {
      title,
      author: String(formData.get("author") || "").trim() || "天小协",
      ...(uploadedPath || selectedPath ? { imagePath: uploadedPath || selectedPath } : {}),
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      workDate: parseDate(formData.get("workDate")),
      sortOrder: parseSortOrder(formData.get("sortOrder"))
    }
  });

  await logAdminAction({
    action: "publicity-work.update",
    actor: session.user,
    target: work.id,
    metadata: { title: work.title, imagePath: work.imagePath, author: work.author }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function setPublicityWorkStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const work = await prisma.publicityWork.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "publicity-work.set-status",
    actor: session.user,
    target: work.id,
    metadata: { title: work.title, status: work.status }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function deletePublicityWork(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const work = await prisma.publicityWork.delete({ where: { id } });

  await logAdminAction({
    action: "publicity-work.delete",
    actor: session.user,
    target: work.id,
    metadata: { title: work.title, imagePath: work.imagePath }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}
