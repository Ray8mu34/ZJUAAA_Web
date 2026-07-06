import { readFile } from "node:fs/promises";

import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { logInternalDownload } from "@/lib/audit-log";
import { hasInternalAccess } from "@/lib/internal-auth";
import { resolveInternalStoragePath } from "@/lib/internal-storage";

function buildContentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (!(await hasInternalAccess())) {
    await logInternalDownload({
      fileId: id,
      status: "unauthorized"
    });
    return new Response("Unauthorized", { status: 401 });
  }

  const file = await prisma.internalFile.findFirst({
    where: { id, status: "PUBLISHED" }
  });

  if (!file) {
    await logInternalDownload({
      fileId: id,
      status: "not-found"
    });
    return new Response("Not Found", { status: 404 });
  }

  const diskPath = resolveInternalStoragePath(file.storagePath);
  if (!diskPath) {
    await logInternalDownload({
      fileId: file.id,
      fileTitle: file.title,
      status: "not-found",
      metadata: { reason: "invalid-storage-path" }
    });
    return new Response("Not Found", { status: 404 });
  }

  try {
    const buffer = await readFile(diskPath);
    await logInternalDownload({
      fileId: file.id,
      fileTitle: file.title,
      status: "success",
      metadata: {
        originalName: file.originalName,
        fileSize: file.fileSize
      }
    });

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(file.fileSize),
        "Content-Disposition": buildContentDisposition(file.originalName),
        "Cache-Control": "private, max-age=0, must-revalidate"
      }
    });
  } catch {
    await logInternalDownload({
      fileId: file.id,
      fileTitle: file.title,
      status: "not-found",
      metadata: { reason: "read-failed" }
    });
    return new Response("Not Found", { status: 404 });
  }
}
