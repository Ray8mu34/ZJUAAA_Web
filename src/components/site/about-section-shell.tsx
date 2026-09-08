import Link from "next/link";
import { ReactNode } from "react";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";

type AboutSectionShellProps = {
  active: "gallery" | "members";
  children: ReactNode;
  introduction?: string | null;
};

const aboutSections = [
  { id: "gallery" as const, href: "/about/gallery", label: "社团影像" },
  { id: "members" as const, href: "/about/members", label: "历届成员" }
];

export function AboutSectionShell({ active, children, introduction }: AboutSectionShellProps) {
  return (
    <>
      <SiteHeader />
      <main className={`section about-page about-${active}-page`}>
        <div className="about-wide-shell">
          <header className="about-page-header" data-reveal>
            <h1>关于我们</h1>
            {introduction ? <p className="muted">{introduction}</p> : null}
            <nav className="about-subnav" aria-label="关于我们栏目">
              {aboutSections.map((section) => (
                <Link
                  aria-current={section.id === active ? "page" : undefined}
                  className={section.id === active ? "is-active" : undefined}
                  href={section.href}
                  key={section.id}
                >
                  {section.label}
                </Link>
              ))}
            </nav>
          </header>

          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
