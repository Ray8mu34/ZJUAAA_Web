import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ image: vi.fn<(props: Record<string, unknown>) => null>(() => null) }));
vi.mock("next/image", () => ({ default: mocks.image }));

import { AlumniBrowser } from "@/components/site/alumni-browser";
import { AlumniGroupsEditor } from "@/components/admin/alumni-groups-editor";
import { getImageVariantUrl } from "@/lib/image-variants";

describe("alumni image rendering", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["/uploads/a.gif", "/uploads/a.GIF?x=1#test", "/uploads/a.png"])(
    "renders %s with the correct optimization and preview URL",
    (photoPath) => {
      const gif = !photoPath.endsWith(".png");
      const groups = [{ year: "2026", members: [{ name: "", role: "", photoPath }] }];

      renderToStaticMarkup(createElement(AlumniBrowser, { groups }));
      expect(mocks.image.mock.calls[0]?.[0]).toMatchObject({
        src: photoPath, unoptimized: gif, fill: true, sizes: "240px"
      });

      mocks.image.mockClear();
      renderToStaticMarkup(createElement(AlumniGroupsEditor, { initialValue: JSON.stringify(groups), options: [] }));
      expect(mocks.image.mock.calls[0]?.[0]).toMatchObject({
        src: gif ? photoPath : getImageVariantUrl(photoPath, "thumb"),
        unoptimized: gif, fill: true, sizes: "120px"
      });
    }
  );
});
