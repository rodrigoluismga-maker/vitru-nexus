import { EmptyState } from "@/components/nexus/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import type { ReactNode } from "react";
import { totalPages } from "@shared/pagination";

export function DataTableShell({
  search,
  onSearch,
  count,
  empty,
  children,
  filters,
  loading = false,
  error,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  search: string;
  onSearch: (value: string) => void;
  count: number;
  empty: { title: string; description: string };
  children: ReactNode;
  filters?: ReactNode;
  loading?: boolean;
  error?: string | null;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
}) {
  const pages = page && pageSize && total !== undefined ? totalPages(total, pageSize) : 1;
  return (
    <section className="nexus-surface mt-6 overflow-hidden rounded-3xl">
      <div className="flex flex-col gap-3 border-b border-white/[0.065] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-tertiary" />
          <Input
            value={search}
            onChange={event => onSearch(event.target.value)}
            placeholder="Buscar por nome ou código..."
            className="h-10 border-white/[0.08] bg-white/[0.035] pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          {filters}
          <span className="whitespace-nowrap text-xs text-content-tertiary">
            {total ?? count} registros
          </span>
        </div>
      </div>
      {loading ? (
        <div className="space-y-3 p-5">
          {[1, 2, 3].map(item => (
            <div key={item} className="h-14 animate-pulse rounded-xl bg-white/[0.035]" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 text-center">
          <p className="text-sm font-semibold text-[var(--status-negative)]">
            Não foi possível carregar a listagem.
          </p>
          <p className="mt-2 text-xs text-content-tertiary">{error}</p>
        </div>
      ) : count ? (
        <div className="overflow-x-auto">{children}</div>
      ) : (
        <div className="p-5">
          <EmptyState {...empty} />
        </div>
      )}
      {onPageChange && page && pageSize && total !== undefined && total > pageSize && (
        <div className="flex items-center justify-between border-t border-white/[0.06] px-5 py-3">
          <span className="text-[11px] uppercase tracking-[.12em] text-content-tertiary">
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= pages}
              onClick={() => onPageChange(page + 1)}
              aria-label="Próxima página"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
