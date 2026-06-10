"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type ThemeMode = "light" | "dark";

const ADMIN_THEME_KEY = "zjuaaa-admin-theme";

function getInitialAdminTheme(): ThemeMode {
  if (typeof window === "undefined") return "dark";

  const stored = window.localStorage.getItem(ADMIN_THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function AdminThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setTheme(getInitialAdminTheme());
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(ADMIN_THEME_KEY, theme);
  }, [isReady, theme]);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = theme === "dark" ? "切换到浅色模式" : "切换到深色模式";

  return (
    <button className="theme-toggle admin-theme-toggle" type="button" aria-label={label} title={label} onClick={() => setTheme(nextTheme)}>
      <Sun className="theme-toggle-sun" aria-hidden="true" size={18} />
      <Moon className="theme-toggle-moon" aria-hidden="true" size={18} />
    </button>
  );
}
