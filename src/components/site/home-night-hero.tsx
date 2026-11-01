import Link from "next/link";
import type { CSSProperties } from "react";
import { NIGHT_OBSERVATORY } from "@/lib/home-style";
import { SITE_NAV_ITEMS } from "@/lib/site-navigation";
import { ThemeToggle } from "./theme-toggle";

// Generated from the same HYG projection as the SVG; no invented bright stars.
import TWINKLES from "@/lib/night-sky-stars.json";
// Minor ticks between the nine dial slots (eight links and the theme switch).
const TICKS = Array.from({ length: 33 }, (_, k) => k / 4).filter((value) => value % 1 !== 0);

/**
 * Night observatory hero: sky and land are separate vector layers sharing one
 * cover-mapped 16:9 stage, with twinkles and a rare meteor on an overlay. The
 * navigation sits on a horizon azimuth scale drawn into the dark foreground.
 */
export function HomeNightHero() {
  return (
    <div className="hero-join night-hero" data-style={NIGHT_OBSERVATORY.number} data-edge-ready="true" data-feather="off">
      <a className="home-skip-link" href="#home-content">跳过图片，查看首页内容</a>
      <section className="home-artwork" aria-label={NIGHT_OBSERVATORY.label}>
        <div className="night-stage">
          {/* Authored vector layers; both share the 1920 x 1080 viewBox and this stage. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/night-observatory-sky.svg" alt="" width={1920} height={1080} fetchPriority="high" />
          <svg className="night-motion" viewBox="0 0 1920 1080" aria-hidden="true">
            <defs>
              <linearGradient id="night-meteor" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#dfeaff" stopOpacity="0" />
                <stop offset="1" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            {TWINKLES.map(([x, y, r], index) => (
              <circle key={index} cx={x} cy={y} r={r} style={{ "--twinkle-delay": `${(index * 1.37) % 6}s`, "--twinkle-time": `${4 + (index % 4)}s` } as CSSProperties} />
            ))}
            <g transform="translate(1530 150) rotate(146)">
              <rect className="night-meteor" x="0" y="-.8" width="260" height="1.6" rx=".8" fill="url(#night-meteor)" />
            </g>
          </svg>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/home/night-observatory-land.svg" alt="星空下的观测站：银河自地平线升起，观测者用绿色激光指向心宿二。" width={1920} height={1080} fetchPriority="high" />
        </div>
        <h1 className="home-visually-hidden">浙江大学学生天文爱好者协会</h1>
        <nav className="night-dial" aria-label="首页画内导航">
          <span className="night-dial-arc" aria-hidden="true" />
          <span className="night-dial-arc is-inner" aria-hidden="true" />
          <span className="night-dial-arc is-second" aria-hidden="true" />
          {TICKS.map((value) => <span key={value} className="night-tick" aria-hidden="true" style={{ "--i": value } as CSSProperties} />)}
          <ul>
            {SITE_NAV_ITEMS.map((item, index) => (
              <li key={item.href} style={{ "--i": index, "--col": index % 4, "--row": Math.floor(index / 4) } as CSSProperties}>
                <Link href={item.href} aria-current={item.href === "/" ? "page" : undefined}>
                  <span className="night-mark" aria-hidden="true" />
                  <span className="night-label">{item.zh}</span>
                </Link>
              </li>
            ))}
            <li className="night-dial-theme" style={{ "--i": SITE_NAV_ITEMS.length } as CSSProperties}>
              <span className="night-mark" aria-hidden="true" />
              <ThemeToggle />
            </li>
          </ul>
        </nav>
      </section>
      <div className="hero-join-tail" aria-hidden="true" />
    </div>
  );
}
