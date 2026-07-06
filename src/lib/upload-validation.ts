import path from "node:path";

import sharp from "sharp";
import type { Metadata } from "sharp";

import { getSafeUploadBaseName } from "@/lib/upload-names";

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

type ValidatedImage = {
  buffer: Buffer;
  ext: string;
  mimeType: string;
  originalName: string;
  safeBaseName: string;
};

type ImageValidationOptions = {
  label?: string;
};

const IMAGE_MIME_BY_EXT: Record<string, string> = {
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp"
};

const SHARP_FORMAT_BY_EXT: Record<string, string> = {
  ".gif": "gif",
  ".jpeg": "jpeg",
  ".jpg": "jpeg",
  ".png": "png",
  ".webp": "webp"
};

function getImageExtension(fileName: string) {
  return path.extname(fileName).toLowerCase();
}

function assertAllowedImageExtension(ext: string, fileName: string) {
  if (!IMAGE_MIME_BY_EXT[ext]) {
    throw new UploadValidationError(`图片“${fileName}”格式不支持，请上传 JPG、PNG、GIF 或 WebP。`);
  }
}

function assertMimeMatchesExtension(mimeType: string | undefined, ext: string, fileName: string) {
  const normalizedMime = mimeType?.trim().toLowerCase();
  if (!normalizedMime || normalizedMime === "application/octet-stream") {
    return;
  }

  if (normalizedMime !== IMAGE_MIME_BY_EXT[ext]) {
    throw new UploadValidationError(`图片“${fileName}”的文件类型与扩展名不一致。`);
  }
}

async function assertRasterImageIsValid(buffer: Buffer, ext: string, fileName: string) {
  let metadata: Metadata;

  try {
    metadata = await sharp(buffer, { animated: ext === ".gif" }).metadata();
  } catch {
    throw new UploadValidationError(`图片“${fileName}”无法被识别，请确认文件未损坏。`);
  }

  if (!metadata.width || !metadata.height || metadata.width <= 0 || metadata.height <= 0) {
    throw new UploadValidationError(`图片“${fileName}”尺寸无效。`);
  }

  const expectedFormat = SHARP_FORMAT_BY_EXT[ext];
  if (metadata.format !== expectedFormat) {
    throw new UploadValidationError(`图片“${fileName}”的扩展名与实际图片格式不一致。`);
  }
}

export async function validateImageBuffer({
  buffer,
  fileName,
  mimeType,
  label = "图片"
}: {
  buffer: Buffer;
  fileName: string;
  mimeType?: string;
} & ImageValidationOptions): Promise<ValidatedImage> {
  if (buffer.byteLength <= 0) {
    throw new UploadValidationError(`${label}不能为空。`);
  }

  const ext = getImageExtension(fileName);
  assertAllowedImageExtension(ext, fileName);
  assertMimeMatchesExtension(mimeType, ext, fileName);

  await assertRasterImageIsValid(buffer, ext, fileName);

  return {
    buffer,
    ext,
    mimeType: IMAGE_MIME_BY_EXT[ext],
    originalName: fileName,
    safeBaseName: getSafeUploadBaseName(fileName, ext)
  };
}

export async function validateImageFile(file: File, options: ImageValidationOptions = {}) {
  return validateImageBuffer({
    buffer: Buffer.from(await file.arrayBuffer()),
    fileName: file.name,
    mimeType: file.type,
    ...options
  });
}
