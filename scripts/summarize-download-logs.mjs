import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

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

function resolveLogDir(env) {
  const value = env.AUDIT_LOG_DIR || "logs";
  return path.isAbsolute(value) ? value : path.join(projectRoot, value);
}

async function readJsonl(filePath) {
  const content = await fs.readFile(filePath, "utf8").catch((error) => {
    if (error.code === "ENOENT") return "";
    throw error;
  });

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function increment(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

async function main() {
  const env = { ...(await parseEnvFile()), ...process.env };
  const logDir = resolveLogDir(env);
  const entries = await readJsonl(path.join(logDir, "downloads.jsonl"));
  const byStatus = new Map();
  const byDay = new Map();
  const byFile = new Map();

  for (const entry of entries) {
    const status = entry.status || "unknown";
    const day = String(entry.at || "").slice(0, 10) || "unknown";
    const fileLabel = entry.fileTitle || entry.fileId || "unknown";

    increment(byStatus, status);
    increment(byDay, day);
    if (status === "success") {
      increment(byFile, fileLabel);
    }
  }

  const topFiles = [...byFile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([file, count]) => ({ file, count }));

  console.log(
    JSON.stringify(
      {
        logDir,
        total: entries.length,
        byStatus: Object.fromEntries(byStatus),
        byDay: Object.fromEntries([...byDay.entries()].sort()),
        topFiles
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
