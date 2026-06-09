import { readFile } from "node:fs/promises";

import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { hasInternalAccess } from "@/lib/internal-auth";
import { resolveInternalStoragePath } from "@/lib/internal-storage";

function buildContentDisposition(filename: string) {
  const fallback = filename.replace(/[^\x20-\x7E]/g, "_").replace(/"/g, "'");
  const encoded = encodeURIComponent(filename);
  return `attachment; filename="${fallback}"; filename*=UTF-8''${encoded}`;
}

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  if (!(await hasInternalAccess())) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { id } = await context.params;
  const file = await prisma.internalFile.findFirst({
    where: { id, status: "PUBLISHED" }
  });

  if (!file) {
    return new Response("Not Found", { status: 404 });
  }

  const diskPath = resolveInternalStoragePath(file.storagePath);
  if (!diskPath) {
    return new Response("Not Found", { status: 404 });
  }

  try {
    const buffer = await readFile(diskPath);

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
    return new Response("Not Found", { status: 404 });
  }
}
