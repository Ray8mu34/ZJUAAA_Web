export function getImageVariantUrl(src?: string | null, variant: "thumb" | "original" = "thumb") {
  if (!src) {
    return "";
  }

  if (!src.startsWith("/uploads/")) {
    return src;
  }

  const [pathname, hash = ""] = src.split("#");
  const [basePath, rawSearch = ""] = pathname.split("?");
  const searchParams = new URLSearchParams(rawSearch);
  searchParams.set("variant", variant);
  const proxiedPath = `/media${basePath}`;

  const query = searchParams.toString();
  return `${proxiedPath}${query ? `?${query}` : ""}${hash ? `#${hash}` : ""}`;
}
