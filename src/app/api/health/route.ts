import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { getInternalFileDir } from "@/lib/internal-storage";
import { getUploadDir } from "@/lib/uploads";

export async function GET() {
  const startedAt = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      ok: true,
      database: "ok",
      uploadDir: getUploadDir(),
      internalFileDir: getInternalFileDir(),
      checkedAt: new Date().toISOString(),
      elapsedMs: Date.now() - startedAt
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        database: "error",
        message: error instanceof Error ? error.message : "Unknown health check error",
        checkedAt: new Date().toISOString(),
        elapsedMs: Date.now() - startedAt
      },
      { status: 503 }
    );
  }
}
