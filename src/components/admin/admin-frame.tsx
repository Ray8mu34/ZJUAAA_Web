"use client";

import { ReactNode } from "react";

import { adminSignOut } from "@/app/admin/actions";
import { AdminSidebar } from "@/components/admin/sidebar";

export function AdminFrame({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-topbar">
          <div>
            <h1>Admin Panel</h1>
            <p className="muted">Manage site content here.</p>
          </div>
          <form action={adminSignOut}>
            <button className="button-link" type="submit">
              Sign out
            </button>
          </form>
        </div>
        {children}
      </main>
    </div>
  );
}
