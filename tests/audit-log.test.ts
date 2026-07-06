import path from "node:path";

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  appendFile: vi.fn(),
  headers: vi.fn()
}));

vi.mock("node:fs/promises", () => ({
  mkdir: mocks.mkdir,
  appendFile: mocks.appendFile
}));

vi.mock("next/headers", () => ({
  headers: mocks.headers
}));

describe("audit log helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUDIT_LOG_DIR = "test-logs";
    mocks.headers.mockResolvedValue(
      new Headers({
        "x-forwarded-for": "203.0.113.10, 10.0.0.1",
        "user-agent": "vitest"
      })
    );
  });

  it("writes admin actions as JSONL with actor and request metadata", async () => {
    const { logAdminAction } = await import("@/lib/audit-log");

    await logAdminAction({
      action: "admin.test",
      actor: {
        id: "admin-1",
        username: "root",
        name: "Root"
      },
      target: "target-1",
      metadata: { ok: true }
    });

    expect(mocks.mkdir).toHaveBeenCalledWith(path.join(process.cwd(), "test-logs"), { recursive: true });
    expect(mocks.appendFile).toHaveBeenCalledTimes(1);

    const [filePath, line] = mocks.appendFile.mock.calls[0];
    expect(filePath).toBe(path.join(process.cwd(), "test-logs", "audit.jsonl"));
    expect(line).toMatch(/\n$/);

    const payload = JSON.parse(String(line));
    expect(payload).toMatchObject({
      type: "admin-action",
      action: "admin.test",
      target: "target-1",
      actor: {
        id: "admin-1",
        username: "root",
        name: "Root"
      },
      metadata: { ok: true },
      request: {
        ip: "203.0.113.10",
        userAgent: "vitest"
      }
    });
  });

  it("does not throw when download logging fails", async () => {
    const { logInternalDownload } = await import("@/lib/audit-log");
    mocks.appendFile.mockRejectedValueOnce(new Error("disk full"));

    await expect(
      logInternalDownload({
        fileId: "file-1",
        fileTitle: "内部资料",
        status: "success"
      })
    ).resolves.toBeUndefined();
  });
});
