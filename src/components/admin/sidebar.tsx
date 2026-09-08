"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarRange, Download, Home, Image, LayoutDashboard, Newspaper, NotebookTabs, Settings, Sparkles, Users } from "lucide-react";

const menuGroups = [
  { label: "工作台", items: [
    { href: "/admin", label: "概览", icon: LayoutDashboard, exact: true },
    { href: "/admin/site", label: "首页管理", icon: Home }
  ]},
  { label: "内容", items: [
    { href: "/admin/posts", label: "科普文章", icon: Newspaper },
    { href: "/admin/manual", label: "天文手册", icon: NotebookTabs },
    { href: "/admin/activities", label: "社团活动", icon: CalendarRange },
    { href: "/admin/gallery", label: "摄影作品", icon: Sparkles },
    { href: "/admin/internal", label: "内部资料", icon: Download }
  ]},
  { label: "资源与系统", items: [
    { href: "/admin/media", label: "媒体库", icon: Image },
    { href: "/admin/admins", label: "管理员", icon: Users },
    { href: "/admin/settings", label: "站点设置", icon: Settings }
  ]}
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="admin-sidebar-head">
        <div className="brand-mark admin-brand">
          <span className="brand-square" />
          <div>
            <strong>ZJUAAA</strong>
            <p>浙江大学学生天文协会</p>
          </div>
        </div>
      </div>
      <nav className="admin-sidebar-nav">
        {menuGroups.map((group) => <div className="admin-nav-group" key={group.label}>
          <p>{group.label}</p>
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return <Link key={href} href={href} className={isActive ? "active" : undefined}><Icon size={17}/><span>{label}</span></Link>;
          })}
        </div>)}
      </nav>
    </aside>
  );
}
