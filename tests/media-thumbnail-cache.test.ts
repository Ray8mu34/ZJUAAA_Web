import { beforeEach, describe, expect, it, vi } from "vitest";
import path from "node:path";
import { NextRequest } from "next/server";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn(), stat: vi.fn(), mkdir: vi.fn(), writeFile: vi.fn() }));
vi.mock("sharp", () => ({ default: vi.fn(() => ({ rotate() { return this; }, resize() { return this; }, webp() { return this; }, toBuffer: async () => Buffer.from("generated-thumb") })) }));

import { readFile, stat } from "node:fs/promises";
import sharp from "sharp";
import { GET } from "@/app/media/[...path]/route";

const source = path.resolve("uploads", "cache-test.png");
const context = { params: Promise.resolve({ path: ["uploads", "cache-test.png"] }) };
const request = (headers?: Record<string, string>) => new NextRequest("http://localhost/media/uploads/cache-test.png?variant=thumb", { headers });

describe("thumbnail cache I/O", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("UPLOAD_DIR", path.resolve("uploads"));
    vi.mocked(stat).mockResolvedValue({ size: 20_000_000, mtimeMs: 1234567, isFile: () => true } as Awaited<ReturnType<typeof stat>>);
  });

  it("serves a cached thumbnail without reading or decoding the original", async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from("cached-thumb"));
    const response = await GET(request(), context);
    expect(await response.text()).toBe("cached-thumb");
    expect(response.headers.get("content-type")).toBe("image/webp");
    expect(response.headers.get("etag")).toMatch(/^"[a-f0-9]{64}"$/);
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).not.toHaveBeenCalledWith(source);
    expect(sharp).not.toHaveBeenCalled();
  });

  it("returns 304 before reading even the cached bytes", async () => {
    vi.mocked(readFile).mockResolvedValue(Buffer.from("cached-thumb"));
    const first = await GET(request(), context);
    vi.mocked(readFile).mockClear();
    const response = await GET(request({ "if-none-match": first.headers.get("etag")! }), context);
    expect(response.status).toBe(304);
    expect(readFile).not.toHaveBeenCalled();
  });

  it("shares one original read and conversion for concurrent cache misses", async () => {
    vi.mocked(readFile).mockImplementation(async (file) => {
      if (file === source) return Buffer.from("large-original");
      throw new Error("cache miss");
    });
    const responses = await Promise.all([GET(request(), context), GET(request(), context)]);
    expect(await Promise.all(responses.map(r => r.text()))).toEqual(["generated-thumb", "generated-thumb"]);
    expect(vi.mocked(readFile).mock.calls.filter(([file]) => file === source)).toHaveLength(1);
    expect(sharp).toHaveBeenCalledTimes(1);
  });
});
