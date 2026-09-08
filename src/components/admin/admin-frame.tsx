"use client";

import { ReactNode } from "react";

import { adminSignOut } from "@/app/admin/actions";
import { LogOut } from "lucide-react";
import { AdminThemeToggle } from "@/components/admin/admin-theme-toggle";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <div className="admin-topbar-title">
            <span>内容工作台</span>
            <strong>ZJUAAA</strong>
          </div>
          <div className="admin-topbar-actions">
            <AdminThemeToggle />
            <form action={adminSignOut}>
              <button className="admin-signout" type="submit">
                <LogOut size={16} /> 退出
              </button>
            </form>
          </div>
        </div>
        {children}
      </main>
    </div>
  );
}
