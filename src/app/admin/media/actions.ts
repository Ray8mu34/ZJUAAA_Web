"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";

function normalizeFiles(formData: FormData) {
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > 0) return files;

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];

  return [];
}

export async function uploadMediaAsset(formData: FormData) {
  const files = normalizeFiles(formData);
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "shared").trim() || "shared";
  const altZh = String(formData.get("altZh") || "").trim() || null;

  if (files.length === 0) {
    throw new Error("请选择至少一张图片后再上传。");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  for (const [index, file] of files.entries()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "-");
    const outputName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
    const outputPath = path.join(uploadDir, outputName);

    await writeFile(outputPath, buffer);

    await prisma.mediaAsset.create({
      data: {
        title: title ? (files.length === 1 ? title : `${title} ${index + 1}`) : file.name,
        category,
        filePath: `/uploads/${outputName}`,
        mimeType: file.type || "application/octet-stream",
        altZh,
        altEn: null,
        fileSize: file.size
      }
    });
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/site");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/gallery");
}

export async function deleteMediaAsset(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/admin/media");
}
