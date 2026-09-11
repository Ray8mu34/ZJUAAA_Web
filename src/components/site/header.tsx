"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { PublicMotion } from "@/components/site/public-motion";

const navItems = [
  { href: "/", zh: "主页", exact: true },
  { href: "/knowledge", zh: "知识科普" },
  { href: "/activities", zh: "社团活动" },
  { href: "/astrophotography", zh: "天文摄影" },
  { href: "/manual", zh: "天文手册" },
  { href: "/internal", zh: "内部资料" },
  { href: "/about", zh: "关于我们" },
  { href: "/contact", zh: "联系我们" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    desktopQuery.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      desktopQuery.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <header className={`site-header${isMenuOpen ? " mobile-menu-open" : ""}`}>
      <PublicMotion />
      <div className="shell nav-row nav-row-site">
        <Link className="mobile-brand" href="/" aria-label="ZJUAAA 首页">
          <span className="brand-square" aria-hidden="true" />
          <strong>ZJUAAA</strong>
        </Link>

        <button
          className="mobile-menu-backdrop"
          type="button"
          aria-label="关闭导航菜单"
          tabIndex={isMenuOpen ? 0 : -1}
          onClick={() => setIsMenuOpen(false)}
        />

        <nav className="nav-links nav-links-compact" id="mobile-site-navigation" aria-label="主导航" suppressHydrationWarning>
          {navItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);

            return (
              <Link key={item.href} href={item.href} className={isActive ? "active" : undefined}>
                <span>{item.zh}</span>
              </Link>
            );
          })}

        </nav>

        <div className="nav-actions">
          <ThemeToggle />

          <button
            className="mobile-menu-button"
            type="button"
            aria-label={isMenuOpen ? "关闭导航菜单" : "打开导航菜单"}
            aria-controls="mobile-site-navigation"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {isMenuOpen ? <X aria-hidden="true" size={22} /> : <Menu aria-hidden="true" size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
}
