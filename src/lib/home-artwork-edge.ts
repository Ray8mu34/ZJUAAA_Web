/** Geometry-derived background continuation. No image pixels or raster rows are stretched. */
export type EdgeLayer = {
  name: string;
  fill: string;
  opacity: number;
  edges: [number, number, number, number][];
  fields: [number, number, number, string][];
};

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const full = value.length === 3 ? value.split("").map(c => c + c).join("") : value;
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16));
}

function fieldColor(layer: EdgeLayer, x: number, y: number) {
  if (!layer.fields.length) return layer.fill;
  const result = [0, 0, 0];
  let total = 0;
  for (const [left, top, size, fill] of layer.fields) {
    // Smooth reconstruction of the source's independent blurred color field.
    const dx = (x - left - size / 2) / 40;
    const dy = (y - top - size / 2) / 40;
    const weight = Math.exp(-.5 * (dx * dx + dy * dy));
    if (weight < .0001) continue;
    const color = rgb(fill);
    color.forEach((v, i) => { result[i] += v * weight; });
    total += weight;
  }
  return total ? `rgb(${result.map(v => Math.round(v / total)).join(",")})` : layer.fill;
}

export function buildEdgePaint(layers: EdgeLayer[], sourceY: number) {
  const y = Math.min(940.8, sourceY - .15);
  const defs: string[] = [];
  const shapes: string[] = [];
  for (const [index, layer] of layers.entries()) {
    const cuts = layer.edges.flatMap(([x1, y1, x2, y2]) =>
      (y1 <= y && y2 > y) || (y2 <= y && y1 > y) ? [x1 + (x2 - x1) * (y - y1) / (y2 - y1)] : []
    ).sort((a, b) => a - b);
    if (!cuts.length) continue;
    const stops = Array.from({ length: 49 }, (_, i) => {
      const x = i * 1672 / 48;
      return `<stop offset="${i / 48}" stop-color="${fieldColor(layer, x, y)}"/>`;
    }).join("");
    defs.push(`<linearGradient id="edge-${index}" gradientUnits="userSpaceOnUse" x1="0" x2="1672">${stops}</linearGradient>`);
    for (let i = 0; i + 1 < cuts.length; i += 2) {
      const left = Math.max(0, cuts[i]);
      const right = Math.min(1672, cuts[i + 1]);
      if (right <= left) continue;
      shapes.push(`<path d="M${left.toFixed(2)} 0H${right.toFixed(2)}V128H${left.toFixed(2)}Z" fill="url(#edge-${index})" opacity="${layer.opacity}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1672" height="128" viewBox="0 0 1672 128" preserveAspectRatio="none"><defs>${defs.join("")}</defs>${shapes.join("")}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
