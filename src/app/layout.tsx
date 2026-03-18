import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "ZJUAAA",
  description: "浙江大学学生天文爱好者协会官网与内容管理后台"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
