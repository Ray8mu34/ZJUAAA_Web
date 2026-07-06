import Link from "next/link";

import { AdminMediaGrid } from "@/components/admin/admin-media-grid";
import { MediaUploadForm } from "@/components/admin/media-upload-form";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";

const categoryLabels: Record<string, string> = {
  shared: "通用",
  site: "首页 / 页脚",
  knowledge: "知识科普",
  manual: "天文手册",
  activity: "社团活动",
  gallery: "天文摄影",
  internal: "内部资料",
  publicity: "宣传部作品"
};

const PAGE_SIZE = 24;

export default async function AdminMediaPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  await requireAdminSession();

  const { q, page } = await searchParams;
  const keyword = String(q || "").trim();
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1);
  const where = keyword
    ? {
        OR: [
          { title: { contains: keyword } },
          { filePath: { contains: keyword } },
          { category: { contains: keyword } }
        ]
      }
    : undefined;

  const [assets, totalAssets] = await Promise.all([
    prisma.mediaAsset.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    }),
    prisma.mediaAsset.count({ where })
  ]);
  const totalPages = Math.max(1, Math.ceil(totalAssets / PAGE_SIZE));
  const queryPrefix = keyword ? `?q=${encodeURIComponent(keyword)}&` : "?";

  return (
    <div className="admin-stack">
      <section className="admin-card">
        <h2>上传图片</h2>
        <p className="muted">
          媒体库供全站复用。上传时选择用途分类，后续在首页、手册、活动、摄影等模块里会更容易筛选。单文件大小受服务器 512M
          上传配置限制。
        </p>

        <MediaUploadForm />
      </section>

      <section className="admin-card">
        <h2>现有图片</h2>
        <form className="media-library-toolbar" action="/admin/media">
          <input className="media-picker-search" name="q" type="search" defaultValue={keyword} placeholder="搜索标题、分类或文件路径" />
          <button className="button-ghost" type="submit">
            搜索
          </button>
          {keyword ? (
            <Link className="button-ghost" href="/admin/media">
              清除
            </Link>
          ) : null}
          <span className="muted">
            共 {totalAssets} 张，当前第 {currentPage} / {totalPages} 页
          </span>
        </form>
        {assets.length === 0 ? (
          <div className="empty-state">媒体库里还没有图片。先上传后，就可以在各个内容模块里直接选图了。</div>
        ) : (
          <>
            <AdminMediaGrid
              assets={assets.map((asset) => ({
                id: asset.id,
                title: asset.title,
                filePath: asset.filePath,
                mimeType: asset.mimeType,
                category: asset.category
              }))}
              categoryLabels={categoryLabels}
            />
            {totalPages > 1 ? (
              <div className="admin-pagination">
                {currentPage > 1 ? (
                  <Link className="button-ghost" href={`/admin/media${queryPrefix}page=${currentPage - 1}`}>
                    上一页
                  </Link>
                ) : null}
                {currentPage < totalPages ? (
                  <Link className="button-ghost" href={`/admin/media${queryPrefix}page=${currentPage + 1}`}>
                    下一页
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </div>
  );
}
