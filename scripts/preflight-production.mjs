import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const prisma = new PrismaClient();

function parseEnvFile() {
  return fs
    .readFile(path.join(projectRoot, ".env"), "utf8")
    .then((content) => {
      const env = {};
      for (const line of content.split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!match) continue;
        env[match[1]] = match[2].replace(/^["']|["']$/g, "");
      }
      return env;
    })
    .catch(() => ({}));
}

function resolveDir(value, fallback) {
  if (!value) return path.join(projectRoot, fallback);
  return path.isAbsolute(value) ? value : path.join(projectRoot, value);
}

async function pathExists(target) {
  try {
    await fs.access(target);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const env = { ...(await parseEnvFile()), ...process.env };
  const requiredEnv = ["DATABASE_URL", "AUTH_SECRET"];
  const recommendedEnv = ["INTERNAL_AUTH_SECRET", "INTERNAL_USERNAME", "INTERNAL_PASSWORD", "AUDIT_LOG_DIR"];
  const missingRequiredEnv = requiredEnv.filter((key) => !env[key]);
  const missingRecommendedEnv = recommendedEnv.filter((key) => !env[key]);
  const isProduction = env.NODE_ENV === "production";
  const uploadDir = resolveDir(env.UPLOAD_DIR, "uploads");
  const internalFileDir = resolveDir(env.INTERNAL_FILE_DIR, path.join("private_uploads", "internal-files"));
  const auditLogDir = resolveDir(env.AUDIT_LOG_DIR, "logs");
  const nextConfig = await fs.readFile(path.join(projectRoot, "next.config.ts"), "utf8");
  const insecureProductionEnv = isProduction
    ? ["AUTH_SECRET", "INTERNAL_AUTH_SECRET", "INTERNAL_PASSWORD"].filter((key) => {
        const value = String(env[key] || "");
        return !value || value.includes("replace-with") || value.includes("change-this") || value.length < 12;
      })
    : [];

  const checks = {
    missingRequiredEnv,
    missingRecommendedEnv,
    insecureProductionEnv,
    uploadDir,
    uploadDirExists: await pathExists(uploadDir),
    internalFileDir,
    internalFileDirExists: await pathExists(internalFileDir),
    auditLogDir,
    auditLogDirExists: await pathExists(auditLogDir),
    nextBodyLimit512mb: nextConfig.includes('bodySizeLimit: "512mb"')
  };

  await prisma.$queryRaw`SELECT 1`;

  const shouldFail =
    missingRequiredEnv.length > 0 ||
    !checks.nextBodyLimit512mb ||
    (isProduction && (missingRecommendedEnv.length > 0 || insecureProductionEnv.length > 0));

  if (shouldFail) {
    console.error(JSON.stringify({ ok: false, ...checks }, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log(JSON.stringify({ ok: true, database: "ok", ...checks }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
