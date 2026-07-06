import { describe, expect, it } from "vitest";
import sharp from "sharp";

import { validateImageBuffer, UploadValidationError } from "@/lib/upload-validation";

describe("validateImageBuffer", () => {
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
