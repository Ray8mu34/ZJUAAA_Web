"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";

const MAX_IMAGE_SIZE = 80 * 1024 * 1024;

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

  if (!file.type.startsWith("image/")) {
    throw new Error("宣传部作品只支持上传图片。");
  }

  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("图片超过 80MB，请压缩后再上传。");
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "-");
  const outputName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
  const outputPath = path.join(uploadDir, outputName);
  const publicPath = getUploadPublicPath(outputName);

  await writeFile(outputPath, Buffer.from(await file.arrayBuffer()));

  await prisma.mediaAsset.create({
    data: {
      title: title || file.name,
      category: "publicity",
      filePath: publicPath,
      mimeType: file.type || "image/*",
      altZh: title || null,
      altEn: null,
      fileSize: file.size
    }
  });

  return publicPath;
}

export async function createPublicityWork(formData: FormData) {
  const title = String(formData.get("title") || "").trim() || "宣传部作品";
  const uploadedFile = formData.get("imageFile");
  const uploadedPath = uploadedFile instanceof File ? await savePublicityImage(uploadedFile, title) : null;
  const imagePath = uploadedPath || String(formData.get("imagePath") || "").trim();

  if (!imagePath) {
    throw new Error("请上传或选择一张作品图片。");
  }

  await prisma.publicityWork.create({
    data: {
      title,
      imagePath,
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      workDate: parseDate(formData.get("workDate")),
      sortOrder: parseSortOrder(formData.get("sortOrder")),
      status: "PUBLISHED"
    }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function updatePublicityWork(formData: FormData) {
  const id = String(formData.get("id") || "");
  const title = String(formData.get("title") || "").trim() || "宣传部作品";
  const uploadedFile = formData.get("imageFile");
  const uploadedPath = uploadedFile instanceof File ? await savePublicityImage(uploadedFile, title) : null;
  const selectedPath = String(formData.get("imagePath") || "").trim();

  await prisma.publicityWork.update({
    where: { id },
    data: {
      title,
      ...(uploadedPath || selectedPath ? { imagePath: uploadedPath || selectedPath } : {}),
      descriptionZh: String(formData.get("descriptionZh") || "").trim() || null,
      workDate: parseDate(formData.get("workDate")),
      sortOrder: parseSortOrder(formData.get("sortOrder"))
    }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function setPublicityWorkStatus(formData: FormData) {
  const id = String(formData.get("id") || "");
  const status = String(formData.get("status") || "PUBLISHED") as "DRAFT" | "PUBLISHED" | "ARCHIVED";

  await prisma.publicityWork.update({
    where: { id },
    data: { status }
  });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}

export async function deletePublicityWork(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.publicityWork.delete({ where: { id } });

  revalidatePath("/admin/internal/publicity");
  revalidatePath("/internal/publicity");
}
