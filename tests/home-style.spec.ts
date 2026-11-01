import { test, expect } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { HOME_ARTWORKS } from "../src/lib/home-artworks";

loadEnvConfig(process.cwd());

test("admin can switch full-screen artwork and restore the classic homepage", async ({ page }) => {
  test.setTimeout(120_000);
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!username || !password, "Local admin credentials are required.");
  const db = new PrismaClient();
  const original = await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } });
  try {
    await page.goto("/admin/login");
    await page.getByLabel("用户名").fill(username!);
    await page.getByLabel("密码").fill(password!);
    await page.getByRole("button", { name: "登录后台" }).click();
    await page.waitForURL("**/admin");
    await page.goto("/admin/site");
    await page.getByRole("radio", { name: /昼夜交界/ }).check();
    await page.getByRole("button", { name: "应用首页样式" }).click();
    await expect(page.getByText("首页样式已切换。", { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("radio", { name: /昼夜交界/ })).toBeChecked();
    await page.screenshot({ path: ".design-qa/home-style-admin.png" });

    for (const viewport of [{ width: 1600, height: 900 }, { width: 2560, height: 1080 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      await page.locator(".home-artwork img").evaluate((img: HTMLImageElement) => img.decode());
      const layout = await page.evaluate(() => {
        const hero = document.querySelector(".home-artwork")!.getBoundingClientRect();
        const header = document.querySelector(".site-header")!.getBoundingClientRect();
        return { x: hero.x, y: hero.y, width: hero.width, height: hero.height, availableWidth: document.body.clientWidth, viewportWidth: document.documentElement.clientWidth, viewportHeight: innerHeight, scrollWidth: document.documentElement.scrollWidth, headerTop: header.top };
      });
      expect(layout.x).toBe(0);
      expect(layout.y).toBe(0);
      expect(layout.width).toBe(layout.availableWidth);
      expect(layout.viewportWidth - layout.width).toBeLessThanOrEqual(20); // Native scrollbar gutter.
      expect(layout.height).toBe(layout.viewportHeight);
      expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewportWidth);
      expect(layout.headerTop).toBe(0);
      await expect(page.getByRole("heading", { name: "浙江大学学生天文爱好者协会" })).toBeVisible();
      await expect(page.getByRole("navigation", { name: "首页画内导航" }).getByRole("link")).toHaveCount(8);
      await expect(page.locator(".site-header")).toBeHidden();
      await expect(page.locator(".hero-copy, .starfield-toggle, .site-starfield")).toHaveCount(0);
      await expect(page.locator(".home-ending-highlight, .home-ending-line")).toHaveCount(0);
      await page.screenshot({ path: `.design-qa/home-style-${viewport.width}.png` });
      await page.evaluate(() => window.scrollTo({ top: document.querySelector(".hero-join")!.getBoundingClientRect().height + 1, behavior: "instant" }));
      await expect(page.locator(".site-header")).toBeVisible();
      await expect.poll(() => page.locator(".site-header").evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
      if (viewport.width < 768) {
        await page.getByRole("button", { name: "打开导航菜单", exact: true }).click();
        await expect(page.getByRole("navigation", { name: "主导航" })).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
      }
    }

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/admin/site");
    await page.getByRole("radio", { name: /经典文字/ }).check();
    await page.getByRole("button", { name: "应用首页样式" }).click();
    await expect(page.getByText("首页样式已切换。", { exact: true })).toBeVisible();
    await page.goto("/");
    await expect(page.locator(".hero-copy")).toBeVisible();
    await expect(page.locator(".home-artwork")).toHaveCount(0);
    await expect(page.locator(".home-ending-highlight")).toHaveText(/这很天协/);
    const current = await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } });
    const { homeStyle: oldStyle, updatedAt: oldDate, ...oldContent } = original;
    const { homeStyle: newStyle, updatedAt: newDate, ...newContent } = current;
    void oldStyle; void oldDate; void newStyle; void newDate;
    expect(newContent).toEqual(oldContent);
  } finally {
    await db.siteSetting.update({ where: { id: "site" }, data: { homeStyle: original.homeStyle } });
    await db.$disconnect();
  }
});

test("visible flat artworks can be selected in admin and render their own SVG", async ({ page }) => {
  test.setTimeout(240_000);
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  test.skip(!username || !password, "Local admin credentials are required.");
  const db = new PrismaClient();
  const original = await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } });
  try {
    await page.goto("/admin/login");
    await page.getByLabel("用户名").fill(username!);
    await page.getByLabel("密码").fill(password!);
    await page.getByRole("button", { name: "登录后台" }).click();
    await page.waitForURL("**/admin");
    await page.setViewportSize({ width: 1440, height: 1000 });
    for (const artwork of HOME_ARTWORKS.filter((artwork) => artwork.number === "02" || artwork.number === "07")) {
      await page.goto("/admin/site");
      await expect(page.locator('input[name="homeStyle"]')).toHaveCount(4);
      await page.locator(`input[value="${artwork.value}"]`).check();
      await page.getByRole("button", { name: "应用首页样式" }).click();
      await expect(page.getByText("首页样式已切换。", { exact: true })).toBeVisible();
      await page.goto("/");
      const image = page.locator(".home-artwork img");
      await expect(image).toHaveAttribute("src", `/images/home/${artwork.value}.svg`);
      await image.evaluate((img: HTMLImageElement) => img.decode());
      await expect(page.locator(".hero-copy")).toHaveCount(0);
      expect((await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } })).homeStyle).toBe(artwork.value);
    }
    await page.goto("/admin/site");
    await page.screenshot({ path: ".design-qa/collection/admin-picker-desktop.png" });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: ".design-qa/collection/admin-picker-mobile.png" });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator('.home-style-option').evaluateAll(cards => cards.every(card => {
      const box = card.getBoundingClientRect();
      return box.left >= 0 && box.right <= document.documentElement.clientWidth;
    }))).toBe(true);
    const current = await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } });
    expect(current.heroTitleZh).toBe(original.heroTitleZh);
    expect(current.heroImagePath).toBe(original.heroImagePath);
  } finally {
    await db.siteSetting.update({ where: { id: "site" }, data: { homeStyle: original.homeStyle } });
    await db.$disconnect();
  }
});
