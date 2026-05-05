import { NextResponse } from "next/server";

import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

export async function GET() {
  await requireAdminSession();

  const categories = await prisma.manualCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      slug: true,
      titleZh: true
    }
  });

  return NextResponse.json({ categories });
}
