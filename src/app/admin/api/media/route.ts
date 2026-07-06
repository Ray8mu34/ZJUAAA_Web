import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-session";
import { normalizeMediaFiles, saveMediaUpload } from "@/lib/media-upload-service";
import { UploadValidationError } from "@/lib/upload-validation";

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const formData = await request.formData();
  const files = normalizeMediaFiles(formData);
  const title = String(formData.get("title") || "").trim();
  const category = String(formData.get("category") || "shared").trim() || "shared";
  const altZh = String(formData.get("altZh") || "").trim() || null;

  if (files.length === 0) {
    return NextResponse.json({ error: "请先选择要上传的图片文件。" }, { status: 400 });
  }

  try {
    const result = await saveMediaUpload({
      files,
      title,
      category,
      altZh,
      actor: session.user
    });

    return NextResponse.json({
      success: true,
      message: `已上传 ${result.count} 张图片。`,
      count: result.count,
      paths: result.paths
    });
  } catch (error) {
    if (error instanceof UploadValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
