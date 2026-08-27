import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

function pageHref(basePath: string, page: number): string {
  return page <= 1 ? basePath : `${basePath}?page=${page}`;
}

const LINK_CLASSES =
  "flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors";

export function Pagination({ currentPage, totalPages, basePath }: PaginationProps) {
  if (totalPages <= 1) return null;

  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <nav className="flex items-center justify-center gap-1" aria-label="Pagination">
      {hasPrev ? (
        <Link
          href={pageHref(basePath, currentPage - 1)}
          className={cn(LINK_CLASSES, "hover:bg-muted hover:text-foreground")}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(LINK_CLASSES, "cursor-not-allowed text-muted-foreground/40")}
          aria-hidden="true"
        >
          <ChevronLeft className="size-4" />
        </span>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={pageHref(basePath, page)}
          aria-current={page === currentPage ? "page" : undefined}
          className={cn(
            LINK_CLASSES,
            page === currentPage
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted hover:text-foreground"
          )}
        >
          {page}
        </Link>
      ))}

      {hasNext ? (
        <Link
          href={pageHref(basePath, currentPage + 1)}
          className={cn(LINK_CLASSES, "hover:bg-muted hover:text-foreground")}
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Link>
      ) : (
        <span
          className={cn(LINK_CLASSES, "cursor-not-allowed text-muted-foreground/40")}
          aria-hidden="true"
        >
          <ChevronRight className="size-4" />
        </span>
      )}
    </nav>
  );
}
