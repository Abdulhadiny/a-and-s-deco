"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  mobileCardView?: boolean;
  pagination?: PaginationProps;
}

export type { Column };

export function DataTable<T extends { id: string }>({
  columns,
  data,
  loading = false,
  emptyMessage = "No records found.",
  className,
  mobileCardView = true,
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-3 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
        <div className="hidden sm:flex items-center gap-4 mb-4">
          {columns.map((_, i) => (
            <Skeleton key={i} className="h-5 flex-1 rounded-md opacity-50" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg opacity-30" />
        ))}
      </div>
    );
  }

  const visibleColumns = columns.filter((col) => !col.hideOnMobile);

  return (
    <>
      {/* Mobile card view */}
      {mobileCardView && (
        <div className="sm:hidden space-y-3 mb-4">
          {data.length === 0 ? (
            <div className="py-12 bg-zinc-950 border border-zinc-800 rounded-xl text-center text-sm text-zinc-400">
              {emptyMessage}
            </div>
          ) : (
            data.map((row) => (
              <div key={row.id} className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-2">
                {visibleColumns.map((col) => (
                  <div key={col.key} className="flex items-start justify-between gap-4 border-b border-zinc-900 pb-2 last:border-0 last:pb-0">
                    <span className="text-xs text-zinc-500 shrink-0 mt-0.5 uppercase tracking-wider font-semibold">
                      {col.header}
                    </span>
                    <span className="text-sm font-medium text-zinc-200 text-right">{col.cell(row)}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}

      {/* Desktop table view */}
      <div className={cn(
        "bg-zinc-950 border border-zinc-800 overflow-hidden rounded-xl",
        mobileCardView && "hidden sm:block",
        className
      )}>
        <Table>
          <TableHeader className="bg-zinc-900/50 border-b border-zinc-800">
            <TableRow className="hover:bg-transparent border-none">
              {columns.map((col) => (
                <TableHead
                  key={col.key}
                  className={cn(
                    "h-11 px-4 text-xs font-bold uppercase tracking-widest text-zinc-500",
                    col.className
                  )}
                >
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="popLayout">
              {data.length === 0 ? (
                <TableRow className="hover:bg-transparent">
                  <TableCell
                    colSpan={columns.length}
                    className="h-40 text-center"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                        <span className="text-xl">📦</span>
                      </div>
                      <p className="text-sm text-zinc-500">
                        {emptyMessage}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data.map((row) => (
                  <TableRow
                    key={row.id}
                    className="transition-colors border-b border-zinc-900 last:border-0 hover:bg-zinc-900/30 group"
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          "px-4 py-3 text-sm font-medium text-zinc-300 group-hover:text-white transition-colors",
                          col.className
                        )}
                      >
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Pagination footer */}
      {pagination && pagination.totalPages > 1 && (
        <PaginationFooter {...pagination} />
      )}
    </>
  );
}

function PaginationFooter({ page, totalPages, total, limit, onPageChange }: PaginationProps) {
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl">
      <p className="text-sm font-medium text-zinc-500">
        Showing <span className="text-zinc-200">{start}</span>–<span className="text-zinc-200">{end}</span> of{" "}
        <span className="text-zinc-200">{total}</span> records
      </p>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Previous page</span>
        </Button>
        <div className="flex items-center gap-1">
          {getPageNumbers(page, totalPages).map((p, i) =>
            p === "..." ? (
              <span key={`ellipsis-${i}`} className="px-1.5 text-xs text-zinc-600">...</span>
            ) : (
              <Button
                key={p}
                variant={p === page ? "default" : "ghost"}
                size="sm"
                className={cn(
                  "h-8 w-8 rounded-lg text-xs font-bold transition-colors",
                  p === page
                    ? "bg-primary text-white shadow-sm hover:bg-primary/90"
                    : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900"
                )}
                onClick={() => onPageChange(p as number)}
              >
                {p}
              </Button>
            )
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-zinc-900 text-zinc-500 hover:text-zinc-200 transition-colors"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Next page</span>
        </Button>
      </div>
    </div>
  );
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
    pages.push(i);
  }
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
