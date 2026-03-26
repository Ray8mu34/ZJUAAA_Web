import path from "node:path";

export function getUploadDir() {
  const customDir = process.env.UPLOAD_DIR?.trim();
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.join(process.cwd(), customDir);
  }

  return path.join(process.cwd(), "uploads");
}

export function getUploadPublicPath(filename: string) {
  return `/uploads/${filename}`;
}
