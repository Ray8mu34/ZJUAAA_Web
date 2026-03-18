"use client";

import { ReactNode } from "react";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>内容管理后台</h1>
            <p className="muted">在这里维护首页、知识科普、社团活动、天文手册、摄影作品和站点信息。</p>
          </div>
          <button
            className="button-link"
            type="button"
            onClick={() => {
              void signOut({ callbackUrl: "/admin/login" });
            }}
          >
            退出登录
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
