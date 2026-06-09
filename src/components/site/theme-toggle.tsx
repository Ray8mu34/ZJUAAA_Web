"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem("zjuaaa-theme");
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTheme(getInitialTheme());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem("zjuaaa-theme", theme);
  }, [isReady, theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";

  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={theme === "dark" ? "切换到白天模式" : "切换到黑夜模式"}
      title={theme === "dark" ? "切换到白天模式" : "切换到黑夜模式"}
      onClick={() => setTheme(nextTheme)}
    >
      <Sun className="theme-toggle-sun" aria-hidden="true" size={18} />
      <Moon className="theme-toggle-moon" aria-hidden="true" size={18} />
    </button>
  );
}
