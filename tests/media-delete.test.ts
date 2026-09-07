import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  siteCount: vi.fn(), otherCount: vi.fn(), findUnique: vi.fn(), delete: vi.fn()
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/admin-session", () => ({ requireAdminSession: vi.fn(async () => ({ user: {} })) }));
vi.mock("@/lib/audit-log", () => ({ logAdminAction: vi.fn() }));
vi.mock("@/lib/media-upload-service", () => ({ normalizeMediaFiles: vi.fn(), saveMediaUpload: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    siteSetting: { count: mocks.siteCount },
    mediaAsset: { findUnique: mocks.findUnique, delete: mocks.delete },
    knowledgePost: { count: mocks.otherCount },
    activityNotice: { count: mocks.otherCount },
    astroPhoto: { count: mocks.otherCount },
    manualCategory: { count: mocks.otherCount },
    manualChapter: { count: mocks.otherCount },
    publicityWork: { count: mocks.otherCount }
  }
}));

import { deleteMediaAsset } from "@/app/admin/media/actions";

describe("member photo deletion protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.otherCount.mockResolvedValue(0);
    mocks.findUnique.mockResolvedValue({ id: "asset", filePath: "/uploads/a.gif" });
  });

  it("checks alumni JSON references and blocks deletion when referenced", async () => {
    mocks.siteCount.mockResolvedValue(1);
    const form = new FormData();
    form.set("id", "asset");

    await expect(deleteMediaAsset(form)).rejects.toThrow("图片仍被引用");
    expect(mocks.siteCount).toHaveBeenCalledWith({
      where: { OR: expect.arrayContaining([{ alumniGroupsJson: { contains: "/uploads/a.gif" } }]) }
    });
    expect(mocks.delete).not.toHaveBeenCalled();
  });

  it("still allows deletion when no references remain", async () => {
    mocks.siteCount.mockResolvedValue(0);
    const form = new FormData();
    form.set("id", "asset");
    await deleteMediaAsset(form);
    expect(mocks.delete).toHaveBeenCalledWith({ where: { id: "asset" } });
  });
});
