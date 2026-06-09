import path from "node:path";

export function getInternalFileDir() {
  const customDir = process.env.INTERNAL_FILE_DIR?.trim();
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.join(process.cwd(), customDir);
  }

  return path.join(process.cwd(), "private_uploads", "internal-files");
}

export function getInternalStoragePath(filename: string) {
  return path.join("internal-files", filename);
}

export function resolveInternalStoragePath(storagePath: string) {
  const baseDir = path.resolve(getInternalFileDir(), "..");
  const requestedPath = path.resolve(baseDir, storagePath);

  if (!requestedPath.startsWith(baseDir)) {
    return null;
  }

  return requestedPath;
}
