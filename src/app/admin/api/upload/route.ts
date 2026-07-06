import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { createStoredFilename } from "@/lib/upload-names";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";
import { UploadValidationError, validateImageFile } from "@/lib/upload-validation";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") || "manual");

  if (!file) {
    return NextResponse.json({ error: "没有上传文件。" }, { status: 400 });
  }

  let image: Awaited<ReturnType<typeof validateImageFile>>;
  try {
    image = await validateImageFile(file);
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }

  const filename = createStoredFilename(image.originalName);

  const uploadDir = getUploadDir();
  const targetDir = path.join(uploadDir, "manual");
  await mkdir(targetDir, { recursive: true });

  const filePath = path.join(targetDir, filename);
  await writeFile(filePath, image.buffer);

  const publicPath = getUploadPublicPath(`manual/${filename}`);

  const asset = await prisma.mediaAsset.create({
    data: {
      title: file.name.replace(/\.[^.]+$/, ""),
      category,
      filePath: publicPath,
      mimeType: image.mimeType,
      fileSize: image.buffer.byteLength
    }
  });

  await logAdminAction({
    action: "api-upload.create-media",
    actor: session.user,
    target: asset.id,
    metadata: {
      category,
      filePath: publicPath,
      originalName: image.originalName
    }
  });

  return NextResponse.json({ filePath: publicPath, title: file.name });
}
