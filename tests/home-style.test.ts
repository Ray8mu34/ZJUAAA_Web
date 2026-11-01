import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(), upsert: vi.fn(), log: vi.fn(), revalidate: vi.fn()
}));
vi.mock("@/lib/admin-session", () => ({ requireAdminSession: mocks.auth }));
vi.mock("@/lib/db", () => ({ prisma: { siteSetting: { upsert: mocks.upsert } } }));
vi.mock("@/lib/audit-log", () => ({ logAdminAction: mocks.log }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import { updateHomeStyle } from "@/app/admin/site/actions";
import { resolveHomeStyle } from "@/lib/home-style";
import { HOME_STYLES } from "@/lib/home-style";
import { HOME_ARTWORKS } from "@/lib/home-artworks";
import { readFileSync } from "node:fs";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: "test-admin" } });
  mocks.upsert.mockResolvedValue({ id: "site" });
});

describe("homepage style persistence", () => {
  it("rejects unauthenticated changes before writing", async () => {
    mocks.auth.mockRejectedValueOnce(new Error("unauthorized"));
    await expect(updateHomeStyle(new FormData())).rejects.toThrow("unauthorized");
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it.each([null, "", "other", "../../file.svg"])("rejects invalid style %s", async (value) => {
    const form = new FormData();
    if (value !== null) form.set("homeStyle", value);
    expect(await updateHomeStyle(form)).toEqual({ error: "请选择有效的首页样式。" });
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
  it.each(HOME_STYLES.map((style) => style.value))("saves %s without replacing copy or media", async (homeStyle) => {
    const form = new FormData();
    form.set("homeStyle", homeStyle);
    await updateHomeStyle(form);
    expect(mocks.upsert).toHaveBeenCalledWith({ where: { id: "site" }, create: { id: "site", homeStyle }, update: { homeStyle } });
    expect(mocks.revalidate).toHaveBeenCalledWith("/");
    expect(mocks.revalidate).toHaveBeenCalledWith("/admin/site");
  });
  it("falls back to the retained layout for unknown stored values", () => {
    expect(resolveHomeStyle("future-style")).toBe("classic");
    expect(resolveHomeStyle(undefined)).toBe("classic");
  });
  it("ships all twenty independent vector artworks with matching thumbnail files", () => {
    expect(HOME_ARTWORKS).toHaveLength(20);
    expect(new Set(HOME_STYLES.map((style) => style.value)).size).toBe(22);
    for (const artwork of HOME_ARTWORKS) {
      const svg = readFileSync(`public/images/home/${artwork.value}.svg`, "utf8");
      expect(svg).toContain('viewBox="0 0 1672 941"');
      expect(svg).not.toMatch(/<(?:image|script|foreignObject)\b|data:image/i);
      expect(readFileSync(`public/images/home/thumbs/${artwork.value}.webp`).length).toBeGreaterThan(100);
    }
  });
});
