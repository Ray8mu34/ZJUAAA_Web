export function isGifImagePath(src?: string | null) {
  return /\.gif(?:$|[?#])/i.test(src || "");
}
