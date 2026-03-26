import { prisma } from "@/lib/db";

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function generateDefaultAstroPhotoTitle(base?: string) {
  const now = new Date();
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  return `${base || "天文摄影"}-${stamp}`;
}

export async function createUniqueAstroPhotoSlug(seed: string) {
  const baseSlug = slugify(seed) || `astro-${Date.now()}`;
  let slug = baseSlug;
  let suffix = 1;

  while (await prisma.astroPhoto.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}
