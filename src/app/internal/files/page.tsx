import Link from "next/link";
import { Download, FileArchive, LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/site/footer";
import { SiteHeader } from "@/components/site/header";
import { prisma } from "@/lib/db";
import { hasInternalAccess } from "@/lib/internal-auth";

import { internalSignOut } from "../actions";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024 * 1024) return `${(size / 1024 / 1024 / 1024).toFixed(1)} GB`;
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

export default async function InternalFilesPage() {
  if (!(await hasInternalAccess())) {
    redirect(`/internal?next=${encodeURIComponent("/internal/files")}`);
  }

  const files = await prisma.internalFile.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }]
  });

  return (
    <>
      <SiteHeader />
      <main className="internal-page">
        <div className="shell">
          <section className="internal-section-head">
            <Link className="internal-back-link" href="/internal">
              内部资料
            </Link>
            <div className="internal-section-title-row">
              <div>
                <span className="internal-kicker">Files</span>
                <h1>文件下载</h1>
                <p>社团内部资料下载处。请勿向社团外公开传播这里的内容。</p>
              </div>
              <form action={internalSignOut}>
                <button className="button-ghost internal-logout" type="submit">
                  <LogOut size={18} />
                  退出
                </button>
              </form>
            </div>
          </section>

          {files.length === 0 ? (
            <div className="internal-empty">还没有已发布的内部资料。</div>
          ) : (
            <section className="internal-file-list">
              {files.map((file) => (
                <article className="internal-file-card" key={file.id}>
                  <div className="internal-file-icon">
                    <FileArchive size={24} />
                  </div>
                  <div className="internal-file-body">
                    <div className="internal-file-title-row">
                      <h2>{file.title}</h2>
                      {file.category ? <span>{file.category}</span> : null}
                    </div>
                    {file.description ? <p>{file.description}</p> : null}
                    <div className="internal-file-meta">
                      <span>{file.originalName}</span>
                      <span>{formatFileSize(file.fileSize)}</span>
                    </div>
                  </div>
                  <a className="internal-download-button" href={`/internal/files/${file.id}/download`}>
                    <Download size={18} />
                    下载
                  </a>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
