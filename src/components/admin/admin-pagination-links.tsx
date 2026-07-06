import Link from "next/link";

type AdminPaginationLinksProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, string | undefined>;
};

function buildHref(basePath: string, page: number, searchParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams || {})) {
    if (key !== "page" && value) {
      params.set(key, value);
    }
  }

  params.set("page", String(page));
  return `${basePath}?${params.toString()}`;
}

export function AdminPaginationLinks({ basePath, currentPage, totalPages, searchParams }: AdminPaginationLinksProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      {currentPage > 1 ? (
        <Link className="button-ghost" href={buildHref(basePath, currentPage - 1, searchParams)}>
          上一页
        </Link>
      ) : null}
      <span className="muted">
        第 {currentPage} / {totalPages} 页
      </span>
      {currentPage < totalPages ? (
        <Link className="button-ghost" href={buildHref(basePath, currentPage + 1, searchParams)}>
          下一页
        </Link>
      ) : null}
    </div>
  );
}
