import { HOME_ARTWORKS } from "@/lib/home-artworks";

export const HOME_STYLES = [
  { value: "classic", number: "", label: "经典文字", description: "保留现有标题、标语、按钮与星空背景。" },
  ...HOME_ARTWORKS.map((artwork) => ({ ...artwork, description: "整屏插画" }))
] as const;

export type HomeStyle = (typeof HOME_STYLES)[number]["value"];

export function isHomeStyle(value: unknown): value is HomeStyle {
  return HOME_STYLES.some((style) => style.value === value);
}

export function resolveHomeStyle(value: unknown): HomeStyle {
  return isHomeStyle(value) ? value : "classic";
}
