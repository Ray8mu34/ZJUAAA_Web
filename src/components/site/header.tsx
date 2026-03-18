"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", zh: "主页", exact: true },
  { href: "/knowledge", zh: "知识科普" },
  { href: "/activities", zh: "社团活动" },
  { href: "/astrophotography", zh: "天文摄影" },
  { href: "/manual", zh: "天文手册" },
  { href: "/about", zh: "关于我们" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="shell nav-row nav-row-site">
        <nav className="nav-links nav-links-compact" aria-label="Primary" suppressHydrationWarning>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={isActive ? "active" : undefined}>
                <span>{item.zh}</span>
              </Link>
            );
          })}
        </nav>

        <Link className="nav-contact-button" href="/contact">
          联系我们
        </Link>
      </div>
    </header>
  );
}
