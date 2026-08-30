import { expect, test } from "@playwright/test";

const publicPages = ["/", "/knowledge", "/activities", "/astrophotography", "/manual", "/about"];
const viewports = [
  { width: 320, height: 568 },
  { width: 360, height: 800 },
  { width: 375, height: 812 },
  { width: 390, height: 844 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
];

test.describe.configure({ timeout: 120_000 });

test("public pages stay in normal flow at supported viewports", async ({ page }) => {
  for (const viewport of viewports) {
    await page.setViewportSize(viewport);

    for (const pathname of publicPages) {
      await page.goto(pathname, { waitUntil: "domcontentloaded" });

      const layout = await page.evaluate(() => {
        const root = document.documentElement;
        const main = document.querySelector("main");
        const footer = document.querySelector(".site-footer");
        const header = document.querySelector(".site-header");
        const mainBottom = main ? main.getBoundingClientRect().bottom + window.scrollY : 0;
        const footerTop = footer ? footer.getBoundingClientRect().top + window.scrollY : 0;

        return {
          clientWidth: root.clientWidth,
          scrollWidth: root.scrollWidth,
          mainBottom,
          footerTop,
          headerHeight: header?.getBoundingClientRect().height || 0
        };
      });

      expect(layout.scrollWidth, `${pathname} overflows at ${viewport.width}px`).toBeLessThanOrEqual(layout.clientWidth);
      expect(layout.footerTop, `${pathname} footer overlaps main at ${viewport.width}px`).toBeGreaterThanOrEqual(
        layout.mainBottom
      );

      if (viewport.width <= 768) {
        expect(layout.headerHeight).toBeLessThanOrEqual(64);
      }
    }
  }
});

test("mobile navigation exposes every public destination and restores body scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await page.locator("html.motion-ready").waitFor({ state: "attached" });

  const menuButton = page.getByRole("button", { name: "打开导航菜单" });
  await menuButton.click();
  await expect(page.getByRole("button", { name: "关闭导航菜单" }).last()).toHaveAttribute("aria-expanded", "true");

  const navigation = page.getByRole("navigation", { name: "主导航" });
  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole("link")).toHaveCount(8);
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).toBe("hidden");

  await page.getByRole("button", { name: "关闭导航菜单" }).last().click();
  await expect(menuButton).toHaveAttribute("aria-expanded", "false");
  await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});

test("mobile collection layouts use the intended column counts", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto("/astrophotography", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".astro-gallery-masonry")).toHaveCSS("column-count", "2");

  await page.goto("/manual", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".manual-category-grid")).toHaveCSS("grid-template-columns", /\S+\s+\S+/);

  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".about-gallery-masonry")).toHaveCSS("column-count", "2");
  await expect(page.locator(".alumni-member-grid")).toHaveCSS("grid-template-columns", /\S+\s+\S+/);
});
