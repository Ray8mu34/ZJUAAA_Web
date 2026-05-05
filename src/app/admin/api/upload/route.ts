import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";

export async function POST(request: NextRequest) {
  await requireAdminSession();

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const category = String(formData.get("category") || "manual");

  if (!file) {
    return NextResponse.json({ error: "没有上传文件。" }, { status: 400 });
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "不支持的文件类型。" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = path.extname(file.name) || ".png";
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filename = `${timestamp}-${safeName}${ext}`;

  const uploadDir = getUploadDir();
  const targetDir = path.join(uploadDir, "manual");
  await mkdir(targetDir, { recursive: true });

  const filePath = path.join(targetDir, filename);
  await writeFile(filePath, buffer);

  const publicPath = getUploadPublicPath(`manual/${filename}`);

  await prisma.mediaAsset.create({
    data: {
      title: file.name.replace(/\.[^.]+$/, ""),
      category,
      filePath: publicPath,
      mimeType: file.type,
      fileSize: file.size
    }
  });

  return NextResponse.json({ filePath: publicPath, title: file.name });
}
