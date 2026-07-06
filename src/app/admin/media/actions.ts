"use server";

import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { normalizeMediaFiles, saveMediaUpload } from "@/lib/media-upload-service";

export type MediaUploadState = {
  status: "idle" | "success" | "error";
  message: string;
};

async function assertMediaAssetNotReferenced(filePath: string) {
  const [
    siteSettingRefs,
    knowledgePostRefs,
    activityNoticeRefs,
    astroPhotoRefs,
    manualCategoryRefs,
    manualChapterRefs,
    publicityWorkRefs
  ] = await Promise.all([
    prisma.siteSetting.count({
      where: {
        OR: [
          { heroImagePath: filePath },
          { logoImagePath: filePath },
          { aboutGalleryImagePaths: { contains: filePath } }
        ]
      }
    }),
    prisma.knowledgePost.count({ where: { coverImagePath: filePath } }),
    prisma.activityNotice.count({ where: { coverImagePath: filePath } }),
    prisma.astroPhoto.count({ where: { imagePath: filePath } }),
    prisma.manualCategory.count({ where: { coverImagePath: filePath } }),
    prisma.manualChapter.count({ where: { coverImagePath: filePath } }),
    prisma.publicityWork.count({ where: { imagePath: filePath } })
  ]);

  const referenceLabels = [
    siteSettingRefs ? `站点设置 ${siteSettingRefs} 处` : "",
    knowledgePostRefs ? `科普文章 ${knowledgePostRefs} 处` : "",
    activityNoticeRefs ? `活动 ${activityNoticeRefs} 处` : "",
    astroPhotoRefs ? `摄影作品 ${astroPhotoRefs} 处` : "",
    manualCategoryRefs ? `手册栏目 ${manualCategoryRefs} 处` : "",
    manualChapterRefs ? `手册文章 ${manualChapterRefs} 处` : "",
    publicityWorkRefs ? `宣传部作品 ${publicityWorkRefs} 处` : ""
  ].filter(Boolean);

  if (referenceLabels.length > 0) {
    throw new Error(`图片仍被引用，不能删除：${referenceLabels.join("、")}。请先解除引用。`);
  }
}

export async function uploadMediaAsset(_state: MediaUploadState, formData: FormData): Promise<MediaUploadState> {
  try {
    const session = await requireAdminSession();

    const files = normalizeMediaFiles(formData);
    const title = String(formData.get("title") || "").trim();
    const category = String(formData.get("category") || "shared").trim() || "shared";
    const altZh = String(formData.get("altZh") || "").trim() || null;

    const result = await saveMediaUpload({
      files,
      title,
      category,
      altZh,
      actor: session.user
    });

    return {
      status: "success",
      message: `已上传 ${result.count} 张图片。`
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "上传失败，请稍后重试。"
    };
  }
}

export async function deleteMediaAsset(formData: FormData) {
  const session = await requireAdminSession();

  const id = String(formData.get("id") || "");
  const asset = await prisma.mediaAsset.findUnique({ where: { id } });

  if (!asset) {
    throw new Error("媒体文件不存在。");
  }

  await assertMediaAssetNotReferenced(asset.filePath);
  await prisma.mediaAsset.delete({ where: { id } });
  await logAdminAction({
    action: "media.delete",
    actor: session.user,
    target: id,
    metadata: {
      title: asset.title,
      filePath: asset.filePath,
      category: asset.category
    }
  });
  revalidatePath("/admin/media");
}
