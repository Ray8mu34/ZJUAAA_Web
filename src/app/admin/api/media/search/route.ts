import { NextRequest, NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 60;

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() || "";
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number.parseInt(searchParams.get("pageSize") || String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const categories = (searchParams.get("categories") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const where = {
    AND: [
      categories.length > 0 ? { category: { in: categories } } : {},
      q
        ? {
            OR: [
              { title: { contains: q } },
              { filePath: { contains: q } },
              { category: { contains: q } }
            ]
          }
        : {}
    ]
  };

  const [items, total] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        title: true,
        filePath: true,
        category: true
      }
    }),
    prisma.mediaAsset.count({ where })
  ]);

  return NextResponse.json({
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  });
}
