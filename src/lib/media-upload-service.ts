import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { revalidatePath } from "next/cache";

import { createUniqueAstroPhotoSlug, generateDefaultAstroPhotoTitle } from "@/lib/astro-photo";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { createStoredFilename } from "@/lib/upload-names";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";
import { validateImageFile } from "@/lib/upload-validation";

import type { Session } from "next-auth";

const DEFAULT_PHOTOGRAPHER = "天小协";

export type MediaUploadResult = {
  count: number;
  paths: string[];
};

export function normalizeMediaFiles(formData: FormData) {
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File && value.size > 0);

  if (files.length > 0) return files;

  const single = formData.get("file");
  if (single instanceof File && single.size > 0) return [single];

  return [];
}

export function revalidateMediaConsumers() {
  revalidatePath("/admin/media");
  revalidatePath("/admin/site");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/manual");
  revalidatePath("/admin/activities");
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/internal/publicity");
  revalidatePath("/admin/settings");
  revalidatePath("/about");
  revalidatePath("/");
  revalidatePath("/astrophotography");
  revalidatePath("/internal/publicity");
}

export async function saveMediaUpload({
  files,
  title,
  category,
  altZh,
  actor
}: {
  files: File[];
  title: string;
  category: string;
  altZh?: string | null;
  actor?: Session["user"] | null;
}): Promise<MediaUploadResult> {
  if (files.length === 0) {
    throw new Error("请先选择要上传的图片文件。");
  }

  const validatedFiles = await Promise.all(files.map((file) => validateImageFile(file)));
  const uploadDir = getUploadDir();
  await mkdir(uploadDir, { recursive: true });

  const newPaths: string[] = [];

  for (const [index, file] of validatedFiles.entries()) {
    const outputName = createStoredFilename(file.originalName);
    const outputPath = path.join(uploadDir, outputName);
    const publicPath = getUploadPublicPath(outputName);
    const fallbackTitle = title ? (validatedFiles.length === 1 ? title : `${title} ${index + 1}`) : file.originalName;

    await writeFile(outputPath, file.buffer);

    await prisma.mediaAsset.create({
      data: {
        title: fallbackTitle,
        category,
        filePath: publicPath,
        mimeType: file.mimeType,
        altZh: altZh || null,
        altEn: null,
        fileSize: file.buffer.byteLength
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

  await logAdminAction({
    action: "media.upload",
    actor,
    metadata: {
      category,
      count: validatedFiles.length,
      paths: newPaths
    }
  });

  revalidateMediaConsumers();

  return {
    count: validatedFiles.length,
    paths: newPaths
  };
}
