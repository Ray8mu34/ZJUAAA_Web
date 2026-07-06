import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const prisma = new PrismaClient();

function parseEnvFile() {
  return fs
    .readFile(path.join(projectRoot, ".env"), "utf8")
    .then((content) => {
      const env = {};
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
      return env;
    })
    .catch(() => ({}));
}

function resolveUploadDir(env) {
  const customDir = env.UPLOAD_DIR || process.env.UPLOAD_DIR;
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.join(projectRoot, customDir);
  }
  return path.join(projectRoot, "uploads");
}

async function listFilesRecursive(root) {
  const results = [];

  async function walk(current) {
    let entries;
    try {
      entries = await fs.readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error.code === "ENOENT") return;
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile()) {
        results.push(fullPath);
      }
    }
  }

  await walk(root);
  return results;
}

function toPublicUploadPath(uploadDir, filePath) {
  const relative = path.relative(uploadDir, filePath).split(path.sep).join("/");
  return `/uploads/${relative}`;
}

async function collectReferencedPaths() {
  const [mediaAssets, siteSettings, posts, activities, photos, categories, chapters, publicityWorks] = await Promise.all([
    prisma.mediaAsset.findMany({ select: { filePath: true } }),
    prisma.siteSetting.findMany({
      select: { heroImagePath: true, logoImagePath: true, aboutGalleryImagePaths: true }
    }),
    prisma.knowledgePost.findMany({ select: { coverImagePath: true, markdownZh: true, markdownEn: true } }),
    prisma.activityNotice.findMany({ select: { coverImagePath: true } }),
    prisma.astroPhoto.findMany({ select: { imagePath: true } }),
    prisma.manualCategory.findMany({ select: { coverImagePath: true } }),
    prisma.manualChapter.findMany({ select: { coverImagePath: true, markdownZh: true, markdownEn: true } }),
    prisma.publicityWork.findMany({ select: { imagePath: true } })
  ]);

  const references = new Set();
  const add = (value) => {
    if (typeof value === "string" && value.trim()) references.add(value.trim());
  };
  const addMarkdownRefs = (value) => {
    if (typeof value !== "string") return;
    for (const match of value.matchAll(/\]\((\/uploads\/[^)]+)\)/g)) {
      add(match[1]);
    }
  };

  mediaAssets.forEach((item) => add(item.filePath));
  siteSettings.forEach((setting) => {
    add(setting.heroImagePath);
    add(setting.logoImagePath);
    setting.aboutGalleryImagePaths
      ?.split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach(add);
  });
  posts.forEach((post) => {
    add(post.coverImagePath);
    addMarkdownRefs(post.markdownZh);
    addMarkdownRefs(post.markdownEn);
  });
  activities.forEach((item) => add(item.coverImagePath));
  photos.forEach((item) => add(item.imagePath));
  categories.forEach((item) => add(item.coverImagePath));
  chapters.forEach((chapter) => {
    add(chapter.coverImagePath);
    addMarkdownRefs(chapter.markdownZh);
    addMarkdownRefs(chapter.markdownEn);
  });
  publicityWorks.forEach((item) => add(item.imagePath));

  return references;
}

async function main() {
  const env = await parseEnvFile();
  const uploadDir = resolveUploadDir(env);
  const [files, references] = await Promise.all([listFilesRecursive(uploadDir), collectReferencedPaths()]);
  const orphanFiles = files
    .map((filePath) => ({
      diskPath: filePath,
      publicPath: toPublicUploadPath(uploadDir, filePath)
    }))
    .filter((item) => !references.has(item.publicPath));

  console.log(
    JSON.stringify(
      {
        uploadDir,
        scannedFileCount: files.length,
        referencedPathCount: references.size,
        orphanFileCount: orphanFiles.length,
        orphanFiles
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
