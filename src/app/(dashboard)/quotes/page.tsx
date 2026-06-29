import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { getQuotes } from "@/lib/actions/quotes";
import { QuotesTable } from "./client";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const { quotes, total } = await getQuotes({ page, pageSize: PAGE_SIZE });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildPageHref(p: number) {
    return p > 1 ? `/quotes?page=${p}` : "/quotes";
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="View and manage generated quotes for all events"
      />

      <QuotesTable quotes={quotes.map((q) => ({
        ...q,
        subtotal: Number(q.subtotal),
        discount: Number(q.discount),
        tax: Number(q.tax),
        total: Number(q.total),
        amountPaid: Number(q.amountPaid),
      }))} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={page > 1 ? <Link href={buildPageHref(page - 1)} /> : undefined}
              disabled={page <= 1}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              render={page < totalPages ? <Link href={buildPageHref(page + 1)} /> : undefined}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
