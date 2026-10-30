"use client";

import { Pause, Play } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const PAUSE_KEY = "zjuaaa-starfield-paused";

type Star = {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  alpha: number;
  hue: number;
};

/** Decorative homepage animation. Reading pages keep a quiet, static background. */
export function StarfieldBackground() {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    try {
      setPaused(window.sessionStorage.getItem(PAUSE_KEY) === "true");
    } catch {
      // The visual effect also works when browser storage is unavailable.
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!isHomePage || !canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const root = document.documentElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let frameId = 0;
    let lastTime = 0;
    let pointerX = 0;
    let pointerY = 0;

    function createStar(initial = false): Star {
      return {
        angle: Math.random() * Math.PI * 2,
        radius: initial ? Math.random() * Math.hypot(width, height) * 0.58 : 30 + Math.random() * 100,
        speed: 0.018 + Math.random() * 0.032,
        size: 0.45 + Math.random() * 1.1,
        alpha: 0.22 + Math.random() * 0.6,
        hue: Math.random() > 0.82 ? 38 : 205
      };
    }

    function draw(delta: number) {
      if (!context) return;
      context.clearRect(0, 0, width, height);
      const originX = width * 0.5 + pointerX * 7;
      const originY = Math.min(height * 0.44, 420) + pointerY * 7;

      for (const star of stars) {
        star.radius += delta * star.speed * (0.3 + star.radius / 350);
        let x = originX + Math.cos(star.angle) * star.radius;
        let y = originY + Math.sin(star.angle) * star.radius;
        if (x < -50 || x > width + 50 || y < -50 || y > height + 50) {
          Object.assign(star, createStar());
          x = originX + Math.cos(star.angle) * star.radius;
          y = originY + Math.sin(star.angle) * star.radius;
        }

        const trail = paused || reducedMotion.matches ? 0 : Math.min(7, star.radius / 210);
        context.strokeStyle = `hsla(${star.hue}, 35%, 82%, ${star.alpha})`;
        context.fillStyle = context.strokeStyle;
        context.lineWidth = star.size * 0.65;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(x - Math.cos(star.angle) * trail, y - Math.sin(star.angle) * trail);
        context.stroke();
        context.beginPath();
        context.arc(x, y, star.size * 0.55, 0, Math.PI * 2);
        context.fill();
      }
    }

    function animate(time: number) {
      // Limit painting to 30 fps; CSS pixels and a capped DPR keep 4K/mobile work bounded.
      if (!lastTime || time - lastTime >= 1000 / 30) {
        draw(lastTime ? Math.min(time - lastTime, 70) : 0);
        lastTime = time;
      }
      frameId = requestAnimationFrame(animate);
    }

    function syncAnimation() {
      cancelAnimationFrame(frameId);
      lastTime = 0;
      if (root.dataset.theme === "light" || document.hidden) return;
      draw(0);
      if (!paused && !reducedMotion.matches) frameId = requestAnimationFrame(animate);
    }

    function resize() {
      if (!canvas || !context) return;
      width = document.documentElement.clientWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = Array.from({ length: width < 700 ? 115 : 300 }, () => createStar(true));
      syncAnimation();
    }

    function onPointerMove(event: PointerEvent) {
      if (paused || reducedMotion.matches || root.dataset.theme === "light" || event.pointerType !== "mouse") return;
      pointerX = event.clientX / width - 0.5;
      pointerY = event.clientY / height - 0.5;
    }

    const themeObserver = new MutationObserver(syncAnimation);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", syncAnimation);
    reducedMotion.addEventListener("change", syncAnimation);
    resize();

    return () => {
      cancelAnimationFrame(frameId);
      themeObserver.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", syncAnimation);
      reducedMotion.removeEventListener("change", syncAnimation);
    };
  }, [isHomePage, paused]);

  if (!isHomePage) return null;

  function togglePaused() {
    const next = !paused;
    setPaused(next);
    try {
      window.sessionStorage.setItem(PAUSE_KEY, String(next));
    } catch {
      // Pausing does not depend on persistence.
    }
  }

  return (
    <>
      <canvas className="site-starfield" ref={canvasRef} aria-hidden="true" />
      <button className="starfield-toggle" type="button" onClick={togglePaused} aria-pressed={paused}>
        {paused ? <Play size={13} aria-hidden="true" /> : <Pause size={13} aria-hidden="true" />}
        <span>{paused ? "播放星空" : "暂停星空"}</span>
      </button>
    </>
  );
}
