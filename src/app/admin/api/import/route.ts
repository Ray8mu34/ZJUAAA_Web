import fs from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import matter from "gray-matter";

import { requireAdminSession } from "@/lib/admin-session";
import { logAdminAction } from "@/lib/audit-log";
import { prisma } from "@/lib/db";
import { createStoredFilename } from "@/lib/upload-names";
import { getUploadDir, getUploadPublicPath } from "@/lib/uploads";
import { UploadValidationError, validateImageBuffer } from "@/lib/upload-validation";
import { validateZipImportEntries, ZipImportValidationError } from "@/lib/zip-import-validation";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9一-龥\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetCategoryId = String(formData.get("categoryId") || "").trim();

    if (!file) {
      return NextResponse.json({ error: "没有上传文件。" }, { status: 400 });
    }

    if (!file.name.endsWith(".zip")) {
      return NextResponse.json({ error: "请上传 ZIP 格式的文件。" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();
    validateZipImportEntries(entries);

    // Find all markdown files and images
    const mdFiles: AdmZip.IZipEntry[] = [];
    const imageFiles: AdmZip.IZipEntry[] = [];
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const ext = path.extname(entry.entryName).toLowerCase();
      const basename = path.basename(entry.entryName);

      // Skip macOS hidden files
      if (basename.startsWith(".") || basename.startsWith("__MACOSX")) continue;

      if (ext === ".md") {
        mdFiles.push(entry);
      } else if (imageExtensions.includes(ext)) {
        imageFiles.push(entry);
      }
    }

    if (mdFiles.length === 0) {
      return NextResponse.json({ error: "ZIP 中没有找到 Markdown 文件。" }, { status: 400 });
    }

    // Determine category
    let categoryId = targetCategoryId;

    if (!categoryId) {
      // Try to infer category from folder structure
      const firstMdPath = mdFiles[0].entryName;
      const parts = firstMdPath.split("/");
      // If there's a folder, use it as category slug
      if (parts.length > 1) {
        const categorySlug = slugify(parts[0]);
        const existingCategory = await prisma.manualCategory.findUnique({
          where: { slug: categorySlug }
        });

        if (existingCategory) {
          categoryId = existingCategory.id;
        } else {
          // Create new category
          const maxSort = await prisma.manualCategory.aggregate({ _max: { sortOrder: true } });
          const newCategory = await prisma.manualCategory.create({
            data: {
              slug: categorySlug,
              titleZh: parts[0],
              summaryZh: `通过批量导入创建的栏目`,
              sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
              isVisible: true
            }
          });
          categoryId = newCategory.id;
        }
      } else {
        return NextResponse.json({ error: "无法确定目标栏目，请在导入时选择栏目。" }, { status: 400 });
      }
    }

    // Upload images and build path mapping
    const uploadDir = getUploadDir();
    const targetDir = path.join(uploadDir, "manual");
    await fs.mkdir(targetDir, { recursive: true });

    const imagePathMap = new Map<string, string>();
    const importedImages: Array<{ originalPath: string; filePath: string }> = [];
    const skippedFiles: Array<{ fileName: string; reason: string }> = [];

    for (const imgEntry of imageFiles) {
      let image: Awaited<ReturnType<typeof validateImageBuffer>>;
      try {
        image = await validateImageBuffer({
          buffer: imgEntry.getData(),
          fileName: path.basename(imgEntry.entryName)
        });
      } catch (error) {
        skippedFiles.push({
          fileName: imgEntry.entryName,
          reason: error instanceof Error ? error.message : "图片校验失败"
        });
        continue;
      }

      const filename = createStoredFilename(image.originalName);

      const filePath = path.join(targetDir, filename);
      await fs.writeFile(filePath, image.buffer);

      const publicPath = getUploadPublicPath(`manual/${filename}`);

      // Store mapping from original path to new public path
      const originalPath = imgEntry.entryName;
      imagePathMap.set(originalPath, publicPath);
      imagePathMap.set(path.basename(originalPath), publicPath);
      importedImages.push({ originalPath, filePath: publicPath });

      // Create MediaAsset record
      await prisma.mediaAsset.create({
        data: {
          title: path.basename(originalPath, image.ext),
          category: "manual",
          filePath: publicPath,
          mimeType: image.mimeType,
          fileSize: image.buffer.byteLength
        }
      });
    }

    // Process markdown files
    const results: Array<{ title: string; slug: string }> = [];
    let sortOrder = 0;

    // Sort by filename to maintain order
    mdFiles.sort((a, b) => a.entryName.localeCompare(b.entryName));

    for (const mdEntry of mdFiles) {
      const content = mdEntry.getData().toString("utf-8");

      // Parse frontmatter if exists
      const { data: frontmatter, content: markdownContent } = matter(content);

      // Determine title
      const basename = path.basename(mdEntry.entryName, ".md");
      const title = frontmatter.title || frontmatter.titleZh || basename.replace(/^\d+[-._]*/, "").trim();

      // Determine order from filename prefix (e.g., "01-intro.md" -> 1)
      const orderMatch = basename.match(/^(\d+)/);
      const chapterSortOrder = frontmatter.sortOrder ?? (orderMatch ? parseInt(orderMatch[1], 10) : sortOrder);

      // Generate slug: use frontmatter slug if available, otherwise generate from title
      const baseSlug = slugify(frontmatter.slug || title) || `chapter-${Date.now()}-${sortOrder}`;
      let slug = baseSlug;
      let suffix = 1;

      while (await prisma.manualChapter.findUnique({ where: { slug } })) {
        suffix += 1;
        slug = `${baseSlug}-${suffix}`;
      }

      // Replace image paths in markdown
      let processedMarkdown = markdownContent;
      for (const [originalPath, newPublicPath] of imagePathMap) {
        // Handle both relative and absolute paths
        const patterns = [
          `](images/${path.basename(originalPath)})`,
          `](./images/${path.basename(originalPath)})`,
          `](${originalPath})`,
          `](./${originalPath})`
        ];

        for (const pattern of patterns) {
          processedMarkdown = processedMarkdown.replace(
            new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
            `](${newPublicPath})`
          );
        }
      }

      // Parse authors: handle both array and string formats
      let author: string | null = null;
      if (Array.isArray(frontmatter.authors)) {
        author = frontmatter.authors.length > 0 ? frontmatter.authors.join("、") : null;
      } else if (typeof frontmatter.author === "string") {
        author = frontmatter.author || null;
      }

      // Create chapter
      const chapter = await prisma.manualChapter.create({
        data: {
          slug,
          categoryId,
          chapterNo: String(chapterSortOrder),
          titleZh: title,
          author,
          markdownZh: processedMarkdown,
          sortOrder: chapterSortOrder,
          status: "DRAFT"
        }
      });

      results.push({ title: chapter.titleZh, slug: chapter.slug });
      sortOrder++;
    }

    await logAdminAction({
      action: "manual-import.zip",
      actor: session.user,
      target: categoryId,
      metadata: {
        sourceFile: file.name,
        importedChapters: results.length,
        importedImages: importedImages.length,
        skippedFiles: skippedFiles.length
      }
    });

    return NextResponse.json({
      success: true,
      message: `成功导入 ${results.length} 篇文章和 ${importedImages.length} 张图片。${skippedFiles.length ? `跳过 ${skippedFiles.length} 个文件。` : ""}`,
      results,
      importedImages,
      skippedFiles
    });
  } catch (error) {
    if (error instanceof UploadValidationError || error instanceof ZipImportValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error("Import error:", error);
    return NextResponse.json({ error: "导入失败，请检查 ZIP 文件格式。" }, { status: 500 });
  }
}
