"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLayoutEffect, useRef, type CSSProperties } from "react";
import type { HOME_ARTWORKS } from "@/lib/home-artworks";
import presets from "@/lib/home-navigation-presets.json";
import { SITE_NAV_ITEMS } from "@/lib/site-navigation";
import { buildEdgePaint, type EdgeLayer } from "@/lib/home-artwork-edge";
import { ThemeToggle } from "./theme-toggle";
import { PublicMotion } from "./public-motion";

type Artwork = (typeof HOME_ARTWORKS)[number];
// Mobile positions are checked against the existing cover crops, not the desktop thumbnail.
const mobilePlacement: Record<string, [number, string]> = {
  "01": [.22, "white"], "02": [.72, "#142c42"], "03": [.78, "white"],
  "04": [.18, "white"], "05": [.22, "white"], "06": [.13, "#142c42"],
  "07": [.10, "white"], "08": [.80, "#142c42"], "09": [.16, "#142c42"],
  "10": [.30, "#142c42"], "11": [.13, "#142c42"], "12": [.864, "white"],
  "13": [.87, "#142c42"], "14": [.12, "white"], "15": [.62, "#142c42"],
  "16": [.52, "#142c42"], "17": [.15, "white"], "18": [.86, "white"],
  "19": [.88, "white"], "20": [.88, "white"]
};
// Each start color belongs to that composition. Mid/deep are explicit design interpolations.
const edgeTints = ["#0f1f35", "#75b7c6", "#19384e", "#23538c", "#12365e", "#113464", "#3e627f", "#1953ae", "#13364a", "#04223f", "#245773", "#0c2d99", "#111a49", "#041fa5", "#012452", "#0a1937", "#172f49", "#285e80", "#132944", "#1f334f"];

export function HomeArtworkHero({ artwork, edgeLayers }: { artwork: Artwork; edgeLayers: EdgeLayer[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const preset = presets.presets.find((entry) => entry.id === artwork.number)!;

  useLayoutEffect(() => {
    const root = rootRef.current!;
    const hero = root.querySelector<HTMLElement>(".home-artwork")!;
    const header = root.querySelector<HTMLElement>(".scene-header")!;
    const title = root.querySelector<HTMLElement>(".scene-title")!;
    const groups = Array.from(root.querySelectorAll<HTMLElement>(".scene-nav-group"));
    let anchor = 0;
    let frame = 0;
    const pin = () => {
      frame = 0;
      header.classList.toggle("is-pinned", hero.getBoundingClientRect().top + anchor <= 0);
    };
    const measure = () => {
      const { width: w, height: h } = hero.getBoundingClientRect();
      const scale = Math.max(w / 1672, h / 941);
      const imageWidth = 1672 * scale;
      const imageHeight = 941 * scale;
      const mobile = w <= 800;
      const cropX = (w - imageWidth) * (w <= 768 ? parseFloat(artwork.mobilePosition) / 100 : .5);
      const cropY = (h - imageHeight) / 2;
      const [mobileY, mobileInk] = mobilePlacement[artwork.number];
      const titleGroup = ["10", "18"].includes(artwork.number) ? preset.groups.length - 1 : 0;
      anchor = Infinity;
      groups.forEach((group, i) => {
        const config = preset.groups[i];
        // At narrow widths all original nodes form one four-column grid.
        if (mobile) return;
        const width = Math.min(config.widthPx, config.maxWidth * imageWidth, w - 32);
        const columns = config.layout === "row" && width < config.items.length * 70
          ? Math.min(3, config.columns) : config.columns;
        const height = Math.ceil(config.items.length / columns) * 44;
        const x = Math.max(16 + width / 2, Math.min(w - 16 - width / 2, cropX + config.x * imageWidth));
        const y = artwork.number === "02" ? .71 * h : cropY + config.y * imageHeight;
        const top = Math.max(i === titleGroup ? 54 : 8, Math.min(h - height - 8, y - height / 2));
        group.style.setProperty("--group-x", `${x}px`);
        group.style.setProperty("--group-top", `${top}px`);
        group.style.setProperty("--group-width", `${width}px`);
        group.style.setProperty("--group-columns", String(columns));
        anchor = Math.min(anchor, top);
        if (i === titleGroup) {
          title.style.setProperty("--title-x", `${Math.max(180, Math.min(w - 180, x))}px`);
          title.style.setProperty("--title-top", `${Math.max(8, top - 48)}px`);
          title.style.setProperty("--title-ink", config.ink === "light" ? "#fff" : "#142c42");
        }
      });
      if (mobile) {
        anchor = Math.max(48, Math.min(h - 140, mobileY * h - 66));
        if (artwork.number === "11") anchor = 76;
        title.style.setProperty("--title-x", "50%");
        title.style.setProperty("--title-top", `${anchor - 38}px`);
        title.style.setProperty("--title-ink", mobileInk);
        if (artwork.number === "11") {
          title.style.setProperty("--title-x", "74px");
          title.style.setProperty("--title-top", "8px");
        }
        if (artwork.number === "07") title.style.setProperty("--title-x", "156px");
        if (artwork.number === "20") title.style.setProperty("--title-ink", "#142c42");
      }
      root.style.setProperty("--mobile-nav-top", `${anchor}px`);
      root.style.setProperty("--mobile-nav-ink", mobileInk);
      // The source observer ends at y=851. Never fade a cropped subject in a short viewport.
      const space = h - (cropY + 851 * scale) - 8;
      const feather = Math.min(8, space);
      root.dataset.feather = artwork.number === "02" && feather >= 4 ? "on" : "off";
      root.style.setProperty("--join-feather", `${Math.max(0, feather)}px`);
      if (edgeLayers) {
        const sourceY = (h - cropY) / scale;
        const isPaperEdge = artwork.number === "02" && sourceY >= 907;
        root.style.setProperty("--join-paint", isPaperEdge ? "linear-gradient(#f8f0e2,#f8f0e2)" : buildEdgePaint(edgeLayers, sourceY));
        root.style.setProperty("--edge-width", `${imageWidth}px`);
        root.style.setProperty("--edge-left", `${cropX}px`);
        root.dataset.edgeReady = "true";
        if (!isPaperEdge) root.dataset.feather = "off";
      }
      pin();
    };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(pin); };
    const observer = new ResizeObserver(measure);
    observer.observe(hero);
    measure();
    window.addEventListener("scroll", scroll, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", scroll); cancelAnimationFrame(frame); };
  }, [artwork, preset, edgeLayers]);

  return (
    <div ref={rootRef} className="hero-join" data-style={artwork.number} data-edge-ready="true" data-feather="off"
      style={{ "--home-artwork-mobile-position": artwork.mobilePosition,
        "--join-tint-start": edgeTints[Number(artwork.number) - 1]
      } as CSSProperties}>
      <a className="home-skip-link" href="#home-content">跳过图片，查看首页内容</a>
      <section className="home-artwork" aria-label={artwork.label}>
        <div className="home-artwork-layer">
          {/* Trusted original vector asset; no raster replacement or composition changes. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/images/home/${artwork.value}.svg`} alt={`${artwork.label}：天文主题矢量插画。`} width={1672} height={941} fetchPriority="high" />
        </div>
        <h1 className="scene-title" aria-label="浙江大学学生天文爱好者协会"><span>浙江大学学生</span><span>天文爱好者协会</span></h1>
        <header className="site-header scene-header">
          <PublicMotion />
          <nav className="scene-navigation" aria-label="主导航">
            {preset.groups.map((group, index) => (
              <div key={index} className="scene-nav-group" style={{
                "--group-x": `${group.x * 100}%`, "--group-top": `${group.y * 100}%`,
                "--group-width": `${group.widthPx}px`, "--group-columns": group.columns,
                "--group-ink": group.ink === "light" ? "#fff" : "#142c42"
              } as CSSProperties}>
                {group.items.map((item) => {
                  if (item === "theme") return <div className="scene-theme" key="theme"><ThemeToggle /></div>;
                  const link = SITE_NAV_ITEMS[Number(item)];
                  const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
                  return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>{link.zh}</Link>;
                })}
              </div>
            ))}
          </nav>
        </header>
      </section>
      <div className="hero-join-tail" aria-hidden="true" />
    </div>
  );
}
