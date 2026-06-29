import Link from "next/link";
import { Suspense } from "react";
import {
  getItems,
  getCategories,
  getInventoryStats,
} from "@/lib/actions/inventory";
import { ItemStatus } from "@/generated/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemFilters } from "@/components/inventory/item-filters";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  PackageIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArchiveIcon,
  TruckIcon,
  PlusIcon,
  ImageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";

type InventoryItem = Awaited<ReturnType<typeof getItems>>["items"][number];
type CategoryEntry = Awaited<ReturnType<typeof getCategories>>[number];

const PAGE_SIZE = 24;

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search =
    typeof params.search === "string" ? params.search : undefined;
  const categoryId =
    typeof params.category === "string" ? params.category : undefined;
  const status =
    typeof params.status === "string"
      ? (params.status as ItemStatus)
      : undefined;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const [{ items, total }, categories, stats] = await Promise.all([
    getItems({ search, categoryId, status, page, pageSize: PAGE_SIZE }),
    getCategories(),
    getInventoryStats(),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // Build a base query string preserving filters but without page
  function buildPageHref(p: number) {
    const qs = new URLSearchParams();
    if (search) qs.set("search", search);
    if (categoryId) qs.set("category", categoryId);
    if (status) qs.set("status", status);
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return `/inventory${str ? `?${str}` : ""}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-normal tracking-tight text-foreground">
            Inventory
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your decoration items and equipment
          </p>
        </div>
        <Button render={<Link href="/inventory/new" />}>
          <PlusIcon />
          Add Item
        </Button>
      </div>

      {/* Stats bar */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total" value={stats.total} icon={PackageIcon} iconClass="text-primary" />
        <StatCard label="Available" value={stats.available} icon={CheckCircleIcon} iconClass="text-success" />
        <StatCard label="Damaged" value={stats.damaged} icon={AlertTriangleIcon} iconClass="text-destructive" />
        <StatCard label="Retired" value={stats.retired} icon={ArchiveIcon} iconClass="text-muted-foreground" />
        <StatCard label="Out" value={stats.out} icon={TruckIcon} iconClass="text-info" />
      </div>

      <Separator />

      {/* Filters */}
      <Suspense fallback={null}>
        <ItemFilters
          categories={categories.map((c: CategoryEntry) => ({ id: c.id, name: c.name }))}
          currentSearch={search}
          currentCategory={categoryId}
          currentStatus={status}
        />
      </Suspense>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {total === 0
          ? "No items found"
          : `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)} of ${total} item${total !== 1 ? "s" : ""}`}
      </p>

      {/* Item grid */}
      {items.length === 0 ? (
        <Card className="shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PackageIcon className="size-10 text-muted-foreground/40" />
            <div>
              <p className="font-medium">No items found</p>
              <p className="text-sm text-muted-foreground">
                {search || categoryId || status
                  ? "Try adjusting your filters."
                  : "Get started by adding your first item."}
              </p>
            </div>
            {!search && !categoryId && !status && (
              <Button render={<Link href="/inventory/new" />} size="sm">
                <PlusIcon />
                Add Item
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item: InventoryItem) => (
              <Link key={item.id} href={`/inventory/${item.id}`} className="group">
                <Card className="h-full shadow-sm transition-shadow hover:ring-2 hover:ring-primary/20">
                  <div className="flex h-36 items-center justify-center bg-muted/50 rounded-t-lg overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                    ) : (
                      <ImageIcon className="size-10 text-muted-foreground/40" />
                    )}
                  </div>
                  <CardContent className="flex flex-col gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium group-hover:text-primary">
                          {item.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.tag}</p>
                      </div>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{item.category?.name ?? "Uncategorized"}</span>
                      <span className="font-medium text-foreground tabular-nums">
                        {formatNGN.format(Number(item.rentalPrice))}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
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
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  iconClass?: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={`size-4 ${iconClass ?? "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-lg font-bold leading-none tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
