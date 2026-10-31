import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { loadEnvConfig } from "@next/env";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { getUploadDir } from "../src/lib/uploads";

loadEnvConfig(process.cwd());

test("publicity lists request thumbnails and load a large image only on expansion", async ({ page, request }) => {
  const db = new PrismaClient();
  const title = `thumbnail-fixture-${crypto.randomUUID()}`;
  const filename = `${title}.png`;
  const imagePath = `/uploads/${filename}`;
  const file = path.join(getUploadDir(), filename);
  const urls: string[] = [];
  try {
    await mkdir(getUploadDir(), { recursive: true });
    await sharp({ create: { width: 3000, height: 4200, channels: 3, background: "#315b86" } }).png().toFile(file);
    await db.publicityWork.create({ data: { title, imagePath, status: "PUBLISHED", workDate: new Date("2000-01-01") } });
    await page.goto("/internal?next=%2Finternal%2Fpublicity");
    await page.getByLabel("账号", { exact: true }).fill(process.env.INTERNAL_USERNAME || "member");
    await page.getByLabel("密码", { exact: true }).fill(process.env.INTERNAL_PASSWORD || "zjuaaa");
    await page.getByRole("button", { name: "登录", exact: true }).click();
    await page.waitForURL("**/internal/publicity");
    page.on("request", event => urls.push(event.url()));
    await page.reload();
    await expect(page.getByRole("heading", { name: "宣传部作品", exact: true })).toBeVisible();
    const previews = page.locator(".publicity-space-card img, .publicity-timeline-card img");
    expect(await previews.count()).toBeGreaterThanOrEqual(2);
    expect(await previews.evaluateAll(images => images.every(image => image.getAttribute("src")?.includes("variant=thumb")))).toBe(true);
    expect(await page.locator(".publicity-timeline-card img").evaluateAll(images => images.every(image => image.getAttribute("loading") === "lazy"))).toBe(true);
    expect(urls.some(url => url.includes("variant=original") || url.includes("%3Doriginal"))).toBe(false);
    expect(urls.some(url => url.includes("/_next/image"))).toBe(false);

    const thumbnail = await request.get(`/media${imagePath}?variant=thumb`);
    expect(thumbnail.ok()).toBe(true);
    expect((await sharp(await thumbnail.body()).metadata()).width).toBe(480);

    const card = page.getByRole("button", { name: `查看 ${title}`, exact: true });
    await card.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".publicity-expanded img")).toHaveAttribute("src", `/media${imagePath}?variant=original`);
    await expect.poll(() => urls.some(url => url.includes(filename) && url.includes("variant=original"))).toBe(true);
    await page.getByRole("button", { name: "关闭作品说明" }).click();
    await expect(page.locator(".publicity-expanded")).toHaveCount(0);
  } finally {
    await db.publicityWork.deleteMany({ where: { title } });
    await db.$disconnect();
    await unlink(file).catch(() => {});
  }
});
