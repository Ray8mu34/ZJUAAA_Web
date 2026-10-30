import type { Metadata } from "next";
import { StarfieldBackground } from "@/components/site/starfield-background";

import "@/app/globals.css";
import "katex/dist/katex.min.css";
import "@/app/styles/public-refinement.css";
import "@/app/styles/public-starfield.css";

export const metadata: Metadata = {
  title: "ZJUAAA",
  description: "浙江大学学生天文爱好者协会官网与内容管理后台"
};

const themeScript = `
(() => {
  try {
    const isAdmin = window.location.pathname.startsWith("/admin");
    const storageKey = isAdmin ? "zjuaaa-admin-theme" : "zjuaaa-theme";
    const stored = localStorage.getItem(storageKey);
    const theme = stored === "light" || stored === "dark"
      ? stored
      : (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch {
    document.documentElement.dataset.theme = "dark";
    document.documentElement.style.colorScheme = "dark";
  }
})();
`;

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <StarfieldBackground />
        {children}
      </body>
    </html>
  );
}
