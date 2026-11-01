import { HOME_ARTWORKS } from "@/lib/home-artworks";

/** Layered scene with its own hero (sky, land, motion and an in-scene navigation dial). */
export const NIGHT_OBSERVATORY = {
  value: "night-observatory", number: "21", label: "星夜观测站", description: "深色星空整屏，导航沿地平方位刻度排布"
} as const;

export const HOME_STYLES = [
  { value: "classic", number: "", label: "经典文字", description: "保留现有标题、标语、按钮与星空背景。" },
  ...HOME_ARTWORKS.map((artwork) => ({ ...artwork, description: "整屏插画" })),
  NIGHT_OBSERVATORY
] as const;

export type HomeStyle = (typeof HOME_STYLES)[number]["value"];

/** Temporarily archived artwork stays resolvable for existing saved selections. */
export const VISIBLE_HOME_STYLES = HOME_STYLES.filter((style) =>
  style.value === "classic" || style.value === "study-02" ||
  style.value === "study-07" || style.value === NIGHT_OBSERVATORY.value
);

export function isHomeStyle(value: unknown): value is HomeStyle {
  return HOME_STYLES.some((style) => style.value === value);
}

export function resolveHomeStyle(value: unknown): HomeStyle {
  return isHomeStyle(value) ? value : "classic";
}
