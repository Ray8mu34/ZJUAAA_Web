import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { validateImageBuffer, UploadValidationError } from "@/lib/upload-validation";
import { animatedGif, staticGif } from "./fixtures/gif";

describe("validateImageBuffer", () => {
  it.each([
    ["static", staticGif, 1],
    ["animated", animatedGif, 2]
  ] as const)("preserves a valid %s GIF", async (_label, buffer, pages) => {
    const result = await validateImageBuffer({ buffer, fileName: "image.GIF", mimeType: "image/gif" });

    expect(result).toMatchObject({ ext: ".gif", mimeType: "image/gif" });
    expect(result.buffer).toBe(buffer);
    const metadata = await sharp(result.buffer, { animated: true }).metadata();
    expect(metadata.pages).toBe(pages);
    if (pages === 2) {
      expect(metadata.delay).toEqual([100, 200]);
      expect(metadata.loop).toBe(0);
    }
  });

  it.each([
    ["image.gif", "image/png", "文件类型与扩展名不一致"],
    ["image.png", "image/png", "扩展名与实际图片格式不一致"]
  ])("rejects GIF with mismatched name/type: %s %s", async (fileName, mimeType, message) => {
    await expect(validateImageBuffer({ buffer: animatedGif, fileName, mimeType })).rejects.toThrow(message);
  });

  it.each(["jpeg", "webp"] as const)("still accepts %s", async (format) => {
    const buffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: "#ffffff" }
    }).toFormat(format).toBuffer();
    const result = await validateImageBuffer({ buffer, fileName: `image.${format}`, mimeType: `image/${format}` });
    expect(result.buffer).toBe(buffer);
    expect(result.mimeType).toBe(`image/${format}`);
  });

  it("accepts a valid PNG", async () => {
    const buffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 4,
        background: "#ffffff"
      }
    })
      .png()
      .toBuffer();

    await expect(
      validateImageBuffer({
        buffer,
        fileName: "星图.png",
        mimeType: "image/png"
      })
    ).resolves.toMatchObject({
      ext: ".png",
      mimeType: "image/png",
      originalName: "星图.png",
      safeBaseName: "星图"
    });
  });

  it("rejects mismatched MIME and extension", async () => {
    const buffer = await sharp({
      create: {
        width: 2,
        height: 2,
        channels: 3,
        background: "#000000"
      }
    })
      .png()
      .toBuffer();

    await expect(
      validateImageBuffer({
        buffer,
        fileName: "photo.jpg",
        mimeType: "image/png"
      })
    ).rejects.toThrow(UploadValidationError);
  });

  it("rejects SVG uploads", async () => {
    await expect(
      validateImageBuffer({
        buffer: Buffer.from("<svg xmlns=\"http://www.w3.org/2000/svg\" />"),
        fileName: "logo.svg",
        mimeType: "image/svg+xml"
      })
    ).rejects.toThrow("格式不支持");
  });
});
