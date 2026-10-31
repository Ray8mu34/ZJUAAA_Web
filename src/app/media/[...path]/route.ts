import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import sharp from "sharp";
import { NextRequest } from "next/server";

import { getUploadDir } from "@/lib/uploads";

const MIME_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".ico": "image/x-icon",
  ".avif": "image/avif"
};

const PROCESSABLE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);
const THUMB_WIDTH = 480;
const WATERMARK_TEXT = "浙江大学学生天文爱好者协会 ZJUAAA";

const globalForMediaCache = globalThis as unknown as {
  mediaThumbnailJobs?: Map<string, Promise<Buffer>>;
  mediaThumbnailQueue?: { active: number; waiting: Array<() => void> };
};
const thumbnailJobs = globalForMediaCache.mediaThumbnailJobs ?? new Map<string, Promise<Buffer>>();
globalForMediaCache.mediaThumbnailJobs = thumbnailJobs;
const thumbnailQueue = globalForMediaCache.mediaThumbnailQueue ?? { active: 0, waiting: [] };
globalForMediaCache.mediaThumbnailQueue = thumbnailQueue;

async function acquireThumbnailSlot() {
  if (thumbnailQueue.active < 2) {
    thumbnailQueue.active += 1;
    return;
  }
  await new Promise<void>(resolve => thumbnailQueue.waiting.push(resolve));
}

function releaseThumbnailSlot() {
  const next = thumbnailQueue.waiting.shift();
  if (next) next();
  else thumbnailQueue.active -= 1;
}

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function getPublicUploadDir() {
  return path.join(process.cwd(), "public", "uploads");
}

async function findFileFromRoots(parts: string[]) {
  const normalizedParts = parts[0] === "uploads" ? parts.slice(1) : parts;
  const roots = [getUploadDir(), getPublicUploadDir()];

  for (const root of roots) {
    const baseDir = path.resolve(root);
    const requestedPath = path.resolve(root, ...normalizedParts);

    if (!requestedPath.startsWith(`${baseDir}${path.sep}`)) {
      continue;
    }

    try {
      const fileStat = await stat(requestedPath);
      if (!fileStat.isFile()) continue;
      return { fileStat, requestedPath };
    } catch {}
  }

  return null;
}

function buildWatermarkSvg(width: number, height: number) {
  const fontSize = Math.max(14, Math.round(Math.min(width, height) / 42));
  const paddingX = Math.max(24, Math.round(width * 0.025));
  const paddingY = Math.max(22, Math.round(height * 0.028));

  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        text {
          fill: rgba(255,255,255,0.62);
          font-size: ${fontSize}px;
          font-family: "Microsoft YaHei", "PingFang SC", sans-serif;
          font-weight: 600;
        }
      </style>
      <text x="${width - paddingX}" y="${height - paddingY}" text-anchor="end">${WATERMARK_TEXT}</text>
    </svg>
  `);
}

async function getCachedThumbnail(filePath: string, size: number, modifiedAt: number) {
  const cacheKey = createHash("sha256").update(`${filePath}:${size}:${modifiedAt}:${THUMB_WIDTH}`).digest("hex");
  const cacheDir = path.join(os.tmpdir(), "zjuaaa-media-thumbnails");
  const cachePath = path.join(cacheDir, `${cacheKey}.webp`);

  try {
    return await readFile(cachePath);
  } catch {}

  const existingJob = thumbnailJobs.get(cacheKey);
  if (existingJob) return existingJob;

  const job = (async () => {
    // Large posters must not all decode simultaneously on a small server.
    await acquireThumbnailSlot();
    try {
      const fileBuffer = await readFile(filePath);
      const buffer = await sharp(fileBuffer, { animated: false })
        .rotate()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .webp({ quality: 76 })
        .toBuffer();
      await mkdir(cacheDir, { recursive: true });
      await writeFile(cachePath, buffer);
      return buffer;
    } finally {
      releaseThumbnailSlot();
    }
  })();

  thumbnailJobs.set(cacheKey, job);
  try {
    return await job;
  } finally {
    thumbnailJobs.delete(cacheKey);
  }
}

async function buildVariantBuffer(filePath: string, variant: string, size: number, modifiedAt: number) {
  const ext = path.extname(filePath).toLowerCase();

  if (PROCESSABLE_EXTENSIONS.has(ext) && variant === "thumb") {
    return { buffer: await getCachedThumbnail(filePath, size, modifiedAt), contentType: "image/webp" };
  }

  const fileBuffer = await readFile(filePath);

  if (!PROCESSABLE_EXTENSIONS.has(ext)) {
    return {
      buffer: fileBuffer,
      contentType: getMimeType(filePath)
    };
  }

  const image = sharp(fileBuffer, { animated: false }).rotate();

  if (variant === "original") {
    const metadata = await image.metadata();
    const width = metadata.width || 1600;
    const height = metadata.height || 1200;
    const watermark = buildWatermarkSvg(width, height);

    const format =
      ext === ".png" ? "png" : ext === ".webp" ? "webp" : ext === ".avif" ? "avif" : "jpeg";

    const buffer = await image
      .composite([{ input: watermark, gravity: "southeast" }])
      .toFormat(format, {
        quality: 92
      })
      .toBuffer();

    return {
      buffer,
      contentType: getMimeType(filePath)
    };
  }

  return {
    buffer: fileBuffer,
    contentType: getMimeType(filePath)
  };
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: parts } = await context.params;
  const fileResult = await findFileFromRoots(parts);

  if (!fileResult) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const variant = req.nextUrl.searchParams.get("variant") || "raw";
    // Next's optimizer also uses this tag in cache filenames: keep it bounded
    // even when uploaded filenames contain long Chinese titles.
    const etag = `"${createHash("sha256").update(`${fileResult.requestedPath}:${fileResult.fileStat.size}:${fileResult.fileStat.mtimeMs}:${variant}`).digest("hex")}"`;

    if (req.headers.get("if-none-match") === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": "public, max-age=31536000, immutable"
        }
      });
    }

    const { buffer, contentType } = await buildVariantBuffer(
      fileResult.requestedPath,
      variant,
      fileResult.fileStat.size,
      fileResult.fileStat.mtimeMs
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
