"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { ThemeToggle } from "@/components/site/theme-toggle";
import { PublicMotion } from "@/components/site/public-motion";

import { SITE_NAV_ITEMS as navItems } from "@/lib/site-navigation";

export function SiteHeader({ afterHero = false }: { afterHero?: boolean }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrollHidden, setIsScrollHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    setIsScrollHidden(false);

    let lastY = Math.max(0, window.scrollY);
    let travel = 0;
    let frameId = 0;
    let headerHeight = header.offsetHeight;
    const measure = () => {
      headerHeight = header.offsetHeight;
      header.style.setProperty("--site-header-height", `${headerHeight}px`);
    };
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(header);
    measure();

    const update = () => {
      frameId = 0;
      const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const y = Math.max(0, Math.min(window.scrollY, maxY));
      const delta = y - lastY;
      lastY = y;

      const heroHeight = afterHero ? document.querySelector(".home-artwork")?.getBoundingClientRect().height || 0 : 0;
      if (isMenuOpen || y <= heroHeight + headerHeight + 24 || header.querySelector(":focus-visible")) {
        travel = 0;
        setIsScrollHidden(false);
        return;
      }
      if (!delta) return;
      travel = Math.sign(delta) === Math.sign(travel) ? travel + delta : delta;
      // Small touchpad movements should not make the navigation flicker.
      if (travel >= 16) setIsScrollHidden(true);
      else if (travel <= -8) setIsScrollHidden(false);
    };
    const onScroll = () => {
      if (!frameId) frameId = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
    };
  }, [pathname, isMenuOpen, afterHero]);

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const desktopQuery = window.matchMedia("(min-width: 769px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setIsMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    desktopQuery.addEventListener("change", closeOnDesktop);
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      desktopQuery.removeEventListener("change", closeOnDesktop);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isMenuOpen]);

  return (
    <header
      ref={headerRef}
      className={`site-header${isMenuOpen ? " mobile-menu-open" : ""}${isScrollHidden ? " is-scroll-hidden" : ""}`}
      onFocusCapture={(event) => {
        if (event.target.matches(":focus-visible")) setIsScrollHidden(false);
      }}
    >
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
