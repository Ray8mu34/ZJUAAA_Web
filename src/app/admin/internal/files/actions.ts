"use server";

import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { getInternalFileDir, getInternalStoragePath, resolveInternalStoragePath } from "@/lib/internal-storage";
import { createStoredFilename } from "@/lib/upload-names";

function parseSortOrder(value: FormDataEntryValue | null) {
  const parsed = Number.parseInt(String(value || "0"), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function saveInternalFile(file: File) {
  if (file.size <= 0) {
    return null;
  }

  const targetDir = getInternalFileDir();
  await mkdir(targetDir, { recursive: true });

  const outputName = createStoredFilename(file.name);
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
  const session = await requireAdminSession();

  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("请先选择要上传的内部资料文件。");
  }

  const savedFile = await saveInternalFile(file);
  if (!savedFile) {
    throw new Error("文件为空，无法上传。");
  }

  const internalFile = await prisma.internalFile.create({
    data: {
      title: String(formData.get("title") || "").trim() || file.name,
      description: String(formData.get("description") || "").trim() || null,
      category: String(formData.get("category") || "").trim() || null,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      status: "PUBLISHED",
      ...savedFile
    }
  });

  await logAdminAction({
    action: "internal-file.create",
    actor: session.user,
    target: internalFile.id,
    metadata: {
      title: internalFile.title,
      category: internalFile.category,
      fileSize: internalFile.fileSize,
      storagePath: internalFile.storagePath
    }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function updateInternalFile(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const file = formData.get("file");
  const replacement = file instanceof File ? await saveInternalFile(file) : null;

  const internalFile = await prisma.internalFile.update({
    where: { id },
    data: {
      title: String(formData.get("title") || "").trim() || "未命名资料",
      description: String(formData.get("description") || "").trim() || null,
      category: String(formData.get("category") || "").trim() || null,
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      ...(replacement || {})
    }
  });

  await logAdminAction({
    action: "internal-file.update",
    actor: session.user,
    target: internalFile.id,
    metadata: {
      title: internalFile.title,
      category: internalFile.category,
      replacedFile: Boolean(replacement)
    }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function setInternalFileStatus(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  const internalFile = await prisma.internalFile.update({
    where: { id },
    data: { status }
  });

  await logAdminAction({
    action: "internal-file.set-status",
    actor: session.user,
    target: internalFile.id,
    metadata: { title: internalFile.title, status: internalFile.status }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}

export async function deleteInternalFile(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const deleteDiskFile = formData.get("deleteDiskFile") === "on";
  const file = await prisma.internalFile.delete({ where: { id } });

  if (deleteDiskFile) {
    const diskPath = resolveInternalStoragePath(file.storagePath);
    if (diskPath) {
      await unlink(diskPath).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") {
          throw error;
        }
      });
    }
  }

  await logAdminAction({
    action: "internal-file.delete",
    actor: session.user,
    target: file.id,
    metadata: {
      title: file.title,
      storagePath: file.storagePath,
      deleteDiskFile
    }
  });

  revalidatePath("/admin/internal/files");
  revalidatePath("/internal/files");
}
