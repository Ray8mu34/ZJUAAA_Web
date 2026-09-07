import { describe, expect, it } from "vitest";

import { isGifImagePath } from "@/lib/image-format";

describe("isGifImagePath", () => {
  it.each(["/uploads/a.gif", "/uploads/a.GIF", "/uploads/a.gif?x=1", "/uploads/a.gif#test"])(
    "recognizes %s",
    (src) => expect(isGifImagePath(src)).toBe(true)
  );

  it.each(["/uploads/a.png", "/uploads/gif-image.png", "", null, undefined])(
    "does not identify %s as GIF",
    (src) => expect(isGifImagePath(src)).toBe(false)
  );
});
