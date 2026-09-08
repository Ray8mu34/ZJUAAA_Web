import Link from "next/link";
import { AdminPaginationLinks } from "@/components/admin/admin-pagination-links";
import { AdminPageHeader, AdminStatus } from "@/components/admin/admin-page-header";
import { requireAdminSession } from "@/lib/admin-session";
import { prisma } from "@/lib/db";
const PAGE_SIZE = 20;
export default async function AdminManualPage({ searchParams }: { searchParams: Promise<{ category?: string; page?: string }> }) {
  await requireAdminSession(); const { category: categoryId, page } = await searchParams;
  const currentPage = Math.max(1, Number.parseInt(String(page || "1"), 10) || 1); const where = categoryId ? { categoryId } : undefined;
  const [categories, chapters, total] = await Promise.all([
    prisma.manualCategory.findMany({ orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] }),
    prisma.manualChapter.findMany({ where, orderBy: [{ sortOrder: "asc" }, { updatedAt: "desc" }], include: { category: { select: { titleZh: true } } }, skip: (currentPage - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.manualChapter.count({ where })
  ]);
  return <div className="admin-stack"><AdminPageHeader eyebrow="CONTENT / MANUAL" title="天文手册" description={`当前范围共 ${total} 篇章节。`} primaryHref="/admin/manual/new" primaryLabel="新建章节">
    <Link className="button-ghost" href="/admin/manual/categories">栏目管理</Link><Link className="button-ghost" href="/admin/manual/import">批量导入</Link></AdminPageHeader>
    <section className="admin-card"><div className="admin-filter-bar"><Link className={`button-ghost ${!categoryId ? "active" : ""}`} href="/admin/manual">全部</Link>{categories.map((cat) => <Link key={cat.id} className={`button-ghost ${categoryId === cat.id ? "active" : ""}`} href={`/admin/manual?category=${cat.id}`}>{cat.titleZh}</Link>)}</div></section>
    <section className="admin-card">{chapters.length === 0 ? <div className="empty-state">当前栏目暂无文章。</div> : <div className="admin-data-list"><div className="admin-data-row admin-data-row-header"><span>章节</span><span>栏目</span><span>状态</span><span>操作</span></div>{chapters.map((chapter) => <Link className="admin-data-row" href={`/admin/manual/${chapter.id}`} key={chapter.id}><span className="admin-data-title"><strong>{chapter.chapterNo}　{chapter.titleZh}</strong><span>/{chapter.slug} · 排序 {chapter.sortOrder}</span></span><span className="admin-data-cell">{chapter.category.titleZh}</span><AdminStatus status={chapter.status}/><span className="admin-data-action">编辑 →</span></Link>)}</div>}
    <AdminPaginationLinks basePath="/admin/manual" currentPage={currentPage} totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))} searchParams={{ category: categoryId }}/></section></div>;
}
