import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { animatedGif } from "./fixtures/gif";

vi.mock("node:fs/promises", () => ({ readFile: vi.fn() }));

import { readFile } from "node:fs/promises";
import { GET } from "@/app/uploads/[...path]/route";

describe("original GIF serving", () => {
  it.each(["", "?variant=thumb", "?variant=original"])("returns unchanged GIF bytes for %s", async (query) => {
    vi.mocked(readFile).mockResolvedValue(animatedGif);
    const response = await GET(new NextRequest(`http://localhost/uploads/a.gif${query}`), {
      params: Promise.resolve({ path: ["a.gif"] })
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/gif");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(animatedGif);
  });
});
