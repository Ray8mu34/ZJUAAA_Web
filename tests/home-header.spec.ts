import { expect, test } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";

loadEnvConfig(process.cwd());

test("artwork exits before the shared scroll-hide header appears", async ({ page }) => {
  const db = new PrismaClient();
  const original = await db.siteSetting.findUniqueOrThrow({ where: { id: "site" } });
  try {
    await db.siteSetting.update({ where: { id: "site" }, data: { homeStyle: "study-02" } });
    await page.emulateMedia({ reducedMotion: "reduce", colorScheme: "dark" });
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      await page.setViewportSize(viewport);
      await page.goto("/");
      const header = page.locator(".site-header");
      await expect(header).toBeHidden();
      await expect(page.getByRole("navigation", { name: "首页画内导航" })).toBeVisible();
      const boundary = await page.locator(".hero-join").evaluate(el => el.getBoundingClientRect().height);
      const scroll = (top: number) => page.evaluate(y => window.scrollTo({ top: y, behavior: "instant" }), top);
      await scroll(boundary - 1);
      await expect(header).toBeHidden();
      await scroll(boundary + 1);
      await expect(header).toBeVisible();
      await expect.poll(() => header.evaluate(el => el.getBoundingClientRect().top)).toBe(0);
      await page.screenshot({ path: `.design-qa/shared-header-${viewport.width}.png` });
      await scroll(boundary + 300);
      await expect(header).toHaveClass(/is-scroll-hidden/);
      await scroll(boundary + 180);
      await expect(header).not.toHaveClass(/is-scroll-hidden/);
      if (viewport.width < 769) {
        await page.getByRole("button", { name: "打开导航菜单", exact: true }).click();
        await expect(page.getByRole("navigation", { name: "主导航" }).getByRole("link")).toHaveCount(8);
        await page.keyboard.press("Escape");
      }
      await scroll(0);
      await expect(header).toBeHidden();
      const artTheme = page.locator(".scene-header .theme-toggle");
      await artTheme.click();
      await expect(page.locator(".site-header .theme-toggle")).toHaveAttribute("aria-label", await artTheme.getAttribute("aria-label") || "");
      await scroll(boundary + 1);
      await expect(header).toBeVisible();
      const appearance = () => page.locator(".site-header").evaluate(el => {
        const style = getComputedStyle(el);
        return { background: style.backgroundColor, border: style.borderBottom, height: el.getBoundingClientRect().height };
      });
      const home = await appearance();
      await page.goto("/about/gallery");
      expect(await appearance()).toEqual(home);
    }
  } finally {
    await db.siteSetting.update({ where: { id: "site" }, data: { homeStyle: original.homeStyle, updatedAt: original.updatedAt } });
    await db.$disconnect();
  }
});
