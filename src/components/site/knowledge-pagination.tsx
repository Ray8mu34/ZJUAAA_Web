import Link from "next/link";

type KnowledgePaginationProps = {
  currentPage: number;
  totalPages: number;
  query?: string;
};

type PaginationItem = number | "ellipsis";

export function getKnowledgePaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const items: PaginationItem[] = [];

  pages.forEach((page, index) => {
    const previousPage = pages[index - 1];

    if (previousPage && page - previousPage > 1) {
      if (page - previousPage === 2) {
        items.push(previousPage + 1);
      } else {
        items.push("ellipsis");
      }
    }

    items.push(page);
  });

  return items;
}

function buildKnowledgePageHref(page: number, query?: string) {
  const params = new URLSearchParams();

  if (query) {
    params.set("q", query);
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const search = params.toString();
  return search ? `/knowledge?${search}` : "/knowledge";
}

export function KnowledgePagination({ currentPage, totalPages, query }: KnowledgePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const items = getKnowledgePaginationItems(currentPage, totalPages);

  return (
    <nav className="knowledge-pagination" aria-label="科普文章分页">
      <Link
        className="knowledge-pagination-direction"
        href={buildKnowledgePageHref(currentPage - 1, query)}
        aria-disabled={currentPage === 1}
        tabIndex={currentPage === 1 ? -1 : undefined}
      >
        上一页
      </Link>

      <div className="knowledge-pagination-pages">
        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span className="knowledge-pagination-ellipsis" aria-hidden="true" key={`ellipsis-${index}`}>
              …
            </span>
          ) : (
            <Link
              aria-current={item === currentPage ? "page" : undefined}
              aria-label={`第 ${item} 页`}
              className={item === currentPage ? "is-current" : ""}
              href={buildKnowledgePageHref(item, query)}
              key={item}
            >
              {item}
            </Link>
          )
        )}
      </div>

      <Link
        className="knowledge-pagination-direction"
        href={buildKnowledgePageHref(currentPage + 1, query)}
        aria-disabled={currentPage === totalPages}
        tabIndex={currentPage === totalPages ? -1 : undefined}
      >
        下一页
      </Link>
    </nav>
  );
}
