import { describe, expect, it } from "vitest";
import { buildEdgePaint, type EdgeLayer } from "../src/lib/home-artwork-edge";
import valley from "../public/images/home/edges/study-03.json";

const svg = (paint: string) => decodeURIComponent(paint.slice(25, -2));

describe("responsive background bands", () => {
  it("projects sloping vector boundaries at the actual crop edge", () => {
    const layer: EdgeLayer = { name: "slope", fill: "#123456", opacity: 1, fields: [], edges: [[0, 0, 0, 941], [0, 0, 941, 941]] };
    expect(svg(buildEdgePaint([layer], 600))).toContain('H599.85');
    expect(svg(buildEdgePaint([layer], 800))).toContain('H799.85');
  });
  it("keeps the deep valley across the complete bottom edge rather than exposing the sky", () => {
    const layer = valley.find(layer => layer.name === "deep-valley") as EdgeLayer;
    expect(svg(buildEdgePaint([layer], 941))).toContain('M0.00 0H1672.00');
  });
  it("outputs vector backgrounds without embedding original imagery", () => {
    const result = svg(buildEdgePaint(valley as EdgeLayer[], 941));
    expect(result).toContain("<linearGradient");
    expect(result).not.toContain("<image");
    expect(result).not.toContain("base64");
  });
});
