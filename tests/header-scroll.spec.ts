import { expect, test } from "@playwright/test";

async function scrollTo(page: import("@playwright/test").Page, top: number) {
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), top);
}

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await page.locator("html.motion-ready").waitFor({ state: "attached" });
});

test("navigation hides on downward scroll and returns on upward scroll or keyboard focus", async ({ page }) => {
  const header = page.locator(".site-header");
  await expect(header).toHaveCSS("background-color", "rgb(13, 23, 37)");
  await scrollTo(page, 600);
  await expect(header).toHaveClass(/is-scroll-hidden/);
  await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().bottom)).toBeLessThanOrEqual(0);
  await scrollTo(page, 560);
  await expect(header).not.toHaveClass(/is-scroll-hidden/);
  await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  await scrollTo(page, 900);
  await expect(header).toHaveClass(/is-scroll-hidden/);
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link").first().focus();
  await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  await scrollTo(page, 0);
  await expect(header).not.toHaveClass(/is-scroll-hidden/);
});

test("stars are homepage-only across client-side navigation and theme changes", async ({ page }) => {
  await expect(page.locator(".site-starfield")).toHaveCount(1);
  await page.getByRole("button", { name: "切换到白天模式" }).click();
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(246, 246, 242)");
  await expect(page.locator(".site-starfield")).toBeHidden();
  await page.getByRole("button", { name: "切换到黑夜模式" }).click();
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "知识科普" }).click();
  await expect(page).toHaveURL(/\/knowledge$/);
  await expect(page.locator(".site-starfield")).toHaveCount(0);
  await expect(page.locator(".starfield-toggle")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(8, 14, 26)");
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(13, 23, 37)");
  await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "主页", exact: true }).click();
  await expect(page.locator(".site-starfield")).toHaveCount(1);
  await expect(page.locator(".site-header")).toHaveCSS("background-color", "rgb(13, 23, 37)");
});

test("mobile menu stays in the viewport and keeps navigation visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const header = page.locator(".site-header");
  await scrollTo(page, 600);
  await expect(header).toHaveClass(/is-scroll-hidden/);
  await scrollTo(page, 550);
  await expect(header).not.toHaveClass(/is-scroll-hidden/);
  await page.getByRole("button", { name: "打开导航菜单", exact: true }).click();
  await expect(header).toHaveClass(/mobile-menu-open/);
  await expect(page.locator("body")).toHaveCSS("overflow", "hidden");
  await expect.poll(() => page.locator("#mobile-site-navigation").evaluate((el) => el.getBoundingClientRect().top)).toBe(60);
  await page.mouse.wheel(0, 300);
  await expect.poll(() => header.evaluate((el) => el.getBoundingClientRect().top)).toBe(0);
  await page.keyboard.press("Escape");
  await expect(header).not.toHaveClass(/mobile-menu-open/);
  await expect(page.locator("body")).not.toHaveCSS("overflow", "hidden");
});
