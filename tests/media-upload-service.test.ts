import { beforeEach, describe, expect, it, vi } from "vitest";
import sharp from "sharp";

import { animatedGif, staticGif } from "./fixtures/gif";

const mocks = vi.hoisted(() => ({ writeFile: vi.fn(), create: vi.fn() }));

vi.mock("node:fs/promises", () => ({ mkdir: vi.fn(), writeFile: mocks.writeFile }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: { mediaAsset: { create: mocks.create } } }));
vi.mock("@/lib/audit-log", () => ({ logAdminAction: vi.fn() }));
vi.mock("@/lib/astro-photo", () => ({
  createUniqueAstroPhotoSlug: vi.fn(), generateDefaultAstroPhotoTitle: vi.fn()
}));

import { saveMediaUpload } from "@/lib/media-upload-service";

describe("GIF media uploads", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([["static", staticGif, 1], ["animated", animatedGif, 2]] as const)(
    "writes the original %s GIF bytes and records image/gif",
    async (_label, buffer, pages) => {
      const result = await saveMediaUpload({
        files: [new File([new Uint8Array(buffer)], "image.gif", { type: "image/gif" })],
        title: "", category: "shared"
      });

      expect(result.count).toBe(1);
      expect(result.paths[0]).toMatch(/^\/uploads\/.+\.gif$/);
      expect(mocks.writeFile).toHaveBeenCalledTimes(1);
      const storedBuffer = mocks.writeFile.mock.calls[0][1];
      expect(storedBuffer).toEqual(buffer);
      expect((await sharp(storedBuffer, { animated: true }).metadata()).pages).toBe(pages);
      expect(mocks.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          filePath: result.paths[0], mimeType: "image/gif", fileSize: buffer.length, category: "shared"
        })
      });
    }
  );
});
