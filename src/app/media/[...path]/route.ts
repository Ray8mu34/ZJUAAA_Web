import { readFile } from "node:fs/promises";
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
const THUMB_WIDTH = 960;
const WATERMARK_TEXT = "浙江大学学生天文爱好者协会 ZJUAAA";

function getMimeType(filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function getPublicUploadDir() {
  return path.join(process.cwd(), "public", "uploads");
}

async function tryReadFileFromRoots(parts: string[]) {
  const normalizedParts = parts[0] === "uploads" ? parts.slice(1) : parts;
  const roots = [getUploadDir(), getPublicUploadDir()];

  for (const root of roots) {
    const baseDir = path.resolve(root);
    const requestedPath = path.resolve(root, ...normalizedParts);

    if (!requestedPath.startsWith(baseDir)) {
      continue;
    }

    try {
      const fileBuffer = await readFile(requestedPath);
      return { fileBuffer, requestedPath };
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

async function buildVariantBuffer(filePath: string, fileBuffer: Buffer, variant: string) {
  const ext = path.extname(filePath).toLowerCase();

  if (!PROCESSABLE_EXTENSIONS.has(ext)) {
    return {
      buffer: fileBuffer,
      contentType: getMimeType(filePath)
    };
  }

  const image = sharp(fileBuffer, { animated: false }).rotate();

  if (variant === "thumb") {
    const buffer = await image
      .resize({
        width: THUMB_WIDTH,
        withoutEnlargement: true
      })
      .webp({ quality: 78 })
      .toBuffer();

    return {
      buffer,
      contentType: "image/webp"
    };
  }

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
  const fileResult = await tryReadFileFromRoots(parts);

  if (!fileResult) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const variant = req.nextUrl.searchParams.get("variant") || "raw";
    const { buffer, contentType } = await buildVariantBuffer(fileResult.requestedPath, fileResult.fileBuffer, variant);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
