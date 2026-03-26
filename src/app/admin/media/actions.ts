"use server";

import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { createUniqueAstroPhotoSlug, generateDefaultAstroPhotoTitle } from "@/lib/astro-photo";
import { prisma } from "@/lib/db";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const DEFAULT_PHOTOGRAPHER = "天小协";

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
    throw new Error("请先选择要上传的图片文件。");
  }

  const oversized = files.find((file) => file.size > MAX_FILE_SIZE);
  if (oversized) {
    throw new Error(`图片“${oversized.name}”超过 50MB，请压缩后再上传。`);
  }

  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const newPaths: string[] = [];

  for (const [index, file] of files.entries()) {
    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = file.name.replace(/[^\w.\u4e00-\u9fa5-]/g, "-");
    const outputName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeName}`;
    const outputPath = path.join(uploadDir, outputName);
    const publicPath = getUploadPublicPath(outputName);
    const fallbackTitle = title ? (files.length === 1 ? title : `${title} ${index + 1}`) : file.name;

    await writeFile(outputPath, buffer);

    await prisma.mediaAsset.create({
      data: {
        title: fallbackTitle,
        category,
        filePath: publicPath,
        mimeType: file.type || "application/octet-stream",
        altZh,
        altEn: null,
        fileSize: file.size
      }
    });

    newPaths.push(publicPath);

    if (category === "gallery") {
      const photoTitle = generateDefaultAstroPhotoTitle(fallbackTitle.replace(/\.[^.]+$/, "").trim() || "天文摄影");
      const slug = await createUniqueAstroPhotoSlug(photoTitle);

      await prisma.astroPhoto.create({
        data: {
          slug,
          titleZh: photoTitle,
          photographer: DEFAULT_PHOTOGRAPHER,
          imagePath: publicPath,
          status: "PUBLISHED"
        }
      });
    }
  }

  if (category === "internal" && newPaths.length > 0) {
    const setting = await prisma.siteSetting.upsert({
      where: { id: "site" },
      create: { id: "site" },
      update: {}
    });

    const existingPaths = (setting.aboutGalleryImagePaths || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);

    const mergedPaths = [...existingPaths];
    for (const item of newPaths) {
      if (!mergedPaths.includes(item)) {
        mergedPaths.push(item);
      }
    }

    await prisma.siteSetting.update({
      where: { id: "site" },
      data: {
        aboutGalleryImagePaths: mergedPaths.join("\n")
      }
    });
  }

  revalidatePath("/admin/media");
  revalidatePath("/admin/site");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/settings");
  revalidatePath("/about");
  revalidatePath("/");
  revalidatePath("/astrophotography");
}

export async function deleteMediaAsset(formData: FormData) {
  const id = String(formData.get("id") || "");
  await prisma.mediaAsset.delete({ where: { id } });
  revalidatePath("/admin/media");
}
