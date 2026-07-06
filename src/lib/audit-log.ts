import { mkdir, appendFile } from "node:fs/promises";
import path from "node:path";

import { headers } from "next/headers";

import type { Session } from "next-auth";

type AuditLogPayload = {
  action: string;
  actor?: Session["user"] | null;
  target?: string;
  metadata?: Record<string, unknown>;
};

type DownloadLogPayload = {
  fileId?: string;
  fileTitle?: string;
  status: "success" | "unauthorized" | "not-found";
  metadata?: Record<string, unknown>;
};

function getAuditLogDir() {
  const customDir = process.env.AUDIT_LOG_DIR?.trim();
  if (customDir) {
    return path.isAbsolute(customDir) ? customDir : path.join(process.cwd(), customDir);
  }

  return path.join(process.cwd(), "logs");
}

async function getRequestMetadata() {
  try {
    const headerStore = await headers();
    return {
      ip: headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || null,
      userAgent: headerStore.get("user-agent") || null,
      pathname: headerStore.get("x-pathname") || null
    };
  } catch {
    return {
      ip: null,
      userAgent: null,
      pathname: null
    };
  }
}

async function appendJsonl(fileName: string, payload: Record<string, unknown>) {
  const logDir = getAuditLogDir();
  await mkdir(logDir, { recursive: true });
  await appendFile(path.join(logDir, fileName), `${JSON.stringify(payload)}\n`, "utf8");
}

export async function logAdminAction({ action, actor, target, metadata }: AuditLogPayload) {
  try {
    await appendJsonl("audit.jsonl", {
      type: "admin-action",
      at: new Date().toISOString(),
      action,
      actor: actor
        ? {
            id: actor.id,
            username: actor.username,
            name: actor.name
          }
        : null,
      target,
      metadata,
      request: await getRequestMetadata()
    });
  } catch {
    // Audit logging should never break the admin operation itself.
  }
}

export async function logInternalDownload({ fileId, fileTitle, status, metadata }: DownloadLogPayload) {
  try {
    await appendJsonl("downloads.jsonl", {
      type: "internal-download",
      at: new Date().toISOString(),
      fileId,
      fileTitle,
      status,
      metadata,
      request: await getRequestMetadata()
    });
  } catch {
    // Download logging is best-effort and must not break downloads.
  }
}
