import { ReactNode } from "react";
import { headers } from "next/headers";

import { AdminFrame } from "@/components/admin/admin-frame";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const pathname = headerStore.get("x-pathname") || "";

  if (pathname.startsWith("/admin/login")) {
    return <>{children}</>;
  }

  return <AdminFrame>{children}</AdminFrame>;
}
