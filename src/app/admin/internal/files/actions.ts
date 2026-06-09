"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getInternalFileDir, getInternalStoragePath } from "@/lib/internal-storage";

const MAX_INTERNAL_FILE_SIZE = 500 * 1024 * 1024;

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function saveInternalFile(file: File) {
  if (file.size <= 0) {
    return null;
  }

  if (file.size > MAX_INTERNAL_FILE_SIZE) {
    throw new Error("文件超过 500MB，请压缩或分拆后再上传。");
  }

  const targetDir = getInternalFileDir();
  await mkdir(targetDir, { recursive: true });

  const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "-");
  const outputName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const outputPath = path.join(targetDir, outputName);

  await writeFile(outputPath, Buffer.from(await file.arrayBuffer()));

  return {
    originalName: file.name,
    storagePath: getInternalStoragePath(outputName),
    mimeType: file.type || "application/octet-stream",
    fileSize: file.size
  };
}

export async function createInternalFile(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("请先选择要上传的内部资料文件。");
  }

  const savedFile = await saveInternalFile(file);
  if (!savedFile) {
    throw new Error("文件为空，无法上传。");
  }

  await prisma.internalFile.create({
    data: {
      title: String(formData.get("title") || "").trim() || file.name,
      description: String(formData.get("description") || "").trim() || null,
      category: String(formData.get("category") || "").trim() || null,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      status: "PUBLISHED",
      ...savedFile
    }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function updateInternalFile(formData: FormData) {
  const id = String(formData.get("id") || "");
  const file = formData.get("file");
  const replacement = file instanceof File ? await saveInternalFile(file) : null;

  await prisma.internalFile.update({
    where: { id },
    data: {
      title: String(formData.get("title") || "").trim() || "未命名资料",
      description: String(formData.get("description") || "").trim() || null,
      category: String(formData.get("category") || "").trim() || null,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      ...(replacement || {})
    }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function setInternalFileStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.internalFile.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function deleteInternalFile(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.internalFile.delete({ where: { id } });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}
