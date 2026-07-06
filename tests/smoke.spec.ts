import { expect, test } from "@playwright/test";
import fs from "node:fs";

function readLocalEnv() {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(".env", "utf8")
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => [match[1], match[2].replace(/^["']|["']$/g, "")])
    );
  } catch {
    return {};
  }
}

test("admin routes redirect anonymous visitors to login", async ({ request }) => {
  const response = await request.get("/admin", { maxRedirects: 0 });

  expect([302, 307, 308]).toContain(response.status());
  expect(response.headers().location).toContain("/admin/login");
});

test("admin login page renders without a session", async ({ request }) => {
  const response = await request.get("/admin/login");
  const body = await response.text();

  expect(response.ok()).toBe(true);
  expect(body).toContain("ZJUAAA CMS");
});

test("internal file downloads require internal access", async ({ request }) => {
  const response = await request.get("/internal/files/missing/download");

  expect(response.status()).toBe(401);
});

test("missing media returns 404", async ({ request }) => {
  const response = await request.get("/media/__smoke_missing__.png");

  expect(response.status()).toBe(404);
});

test("public pages render", async ({ request }) => {
  for (const pathname of ["/", "/knowledge", "/activities", "/astrophotography", "/contact", "/join-us"]) {
    const response = await request.get(pathname);
    expect(response.ok(), `${pathname} should render`).toBe(true);
  }
});

test("health endpoint reports service state", async ({ request }) => {
  const response = await request.get("/api/health");
  const body = await response.json();

  expect(response.ok()).toBe(true);
  expect(body.ok).toBe(true);
  expect(body.database).toBe("ok");
});

test("logged-in admin can see the media upload form", async ({ page }) => {
  const env = readLocalEnv();
  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_PASSWORD;

  test.skip(!username || !password, "ADMIN_USERNAME and ADMIN_PASSWORD are required for authenticated smoke tests.");

  await page.goto("/admin/login");
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin");

  await page.goto("/admin/media?q=__smoke_no_results__");
  await expect(page.getByRole("heading", { name: "上传图片" })).toBeVisible();
  await expect(page.getByLabel("图片文件")).toBeVisible();
});

test("logged-in admin upload API rejects SVG images", async ({ page }) => {
  const env = readLocalEnv();
  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_PASSWORD;

  test.skip(!username || !password, "ADMIN_USERNAME and ADMIN_PASSWORD are required for authenticated smoke tests.");

  await page.goto("/admin/login");
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin");

  const result = await page.evaluate(async () => {
    const formData = new FormData();
    formData.append("files", new File(["<svg xmlns=\"http://www.w3.org/2000/svg\" />"], "bad.svg", { type: "image/svg+xml" }));
    const response = await fetch("/admin/api/media", {
      method: "POST",
      body: formData
    });

    return {
      status: response.status,
      body: await response.json()
    };
  });

  expect(result.status).toBe(400);
  expect(String(result.body.error)).toContain("格式不支持");
});

test("admin paginated pages render with explicit page params", async ({ page }) => {
  const env = readLocalEnv();
  const username = env.ADMIN_USERNAME;
  const password = env.ADMIN_PASSWORD;

  test.skip(!username || !password, "ADMIN_USERNAME and ADMIN_PASSWORD are required for authenticated smoke tests.");

  await page.goto("/admin/login");
  await page.getByLabel("用户名").fill(username);
  await page.getByLabel("密码").fill(password);
  await page.getByRole("button", { name: "登录后台" }).click();
  await page.waitForURL("**/admin");

  for (const pathname of ["/admin/media?page=1", "/admin/posts?page=1", "/admin/manual?page=1"]) {
    await page.goto(pathname);
    await expect(page.locator("main")).toBeVisible();
  }
});
