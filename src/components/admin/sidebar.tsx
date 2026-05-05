"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, Home, Image, LayoutDashboard, Newspaper, NotebookTabs, Settings, Sparkles, Upload, Users } from "lucide-react";

const menu = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard, exact: true },
  { href: "/admin/site", label: "首页管理", icon: Home },
  { href: "/admin/posts", label: "科普文章", icon: Newspaper },
  { href: "/admin/manual", label: "天文手册", icon: NotebookTabs },
  { href: "/admin/manual/categories", label: "栏目管理", icon: NotebookTabs },
  { href: "/admin/manual/import", label: "批量导入", icon: Upload },
  { href: "/admin/activities", label: "社团活动", icon: CalendarRange },
  { href: "/admin/gallery", label: "摄影作品", icon: Sparkles },
  { href: "/admin/media", label: "媒体库", icon: Image },
  { href: "/admin/admins", label: "管理员", icon: Users },
  { href: "/admin/settings", label: "站点设置", icon: Settings }
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <div className="brand-mark">
          <span className="brand-square" />
          <div>
            <strong>ZJUAAA CMS</strong>
            <p>内容管理后台</p>
          </div>
        </div>
      </div>
      <nav className="admin-sidebar-nav">
        {menu.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact ? pathname === href : pathname.startsWith(href);

          return (
            <Link key={href} href={href} className={isActive ? "active" : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
