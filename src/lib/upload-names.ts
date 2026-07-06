import { randomUUID } from "node:crypto";
import path from "node:path";

type StoredFilenameOptions = {
  fallbackBase?: string;
  includeUuid?: boolean;
};

export function getSafeUploadBaseName(fileName: string, ext = path.extname(fileName)) {
  const baseName = ext ? path.basename(fileName, ext) : path.basename(fileName);
  return baseName.replace(/[^\w.\u4e00-\u9fa5-]/g, "-") || "upload";
}

export function createStoredFilename(fileName: string, options: StoredFilenameOptions = {}) {
  const ext = path.extname(fileName).toLowerCase();
  const safeBaseName = getSafeUploadBaseName(fileName, ext);
  const uniquePart = options.includeUuid === false ? "" : `-${randomUUID().slice(0, 8)}`;
  const baseName = safeBaseName || options.fallbackBase || "upload";

  return `${Date.now()}${uniquePart}-${baseName}${ext}`;
}
