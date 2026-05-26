import Link from "next/link";
import { Suspense } from "react";
import {
  getItems,
  getCategories,
  getInventoryStats,
} from "@/lib/actions/inventory";
import { ItemStatus } from "@/generated/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemFilters } from "@/components/inventory/item-filters";
import {
  PackageIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArchiveIcon,
  TruckIcon,
  PlusIcon,
  ImageIcon,
} from "lucide-react";

type InventoryItem = Awaited<ReturnType<typeof getItems>>[number];
type CategoryEntry = Awaited<ReturnType<typeof getCategories>>[number];

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function statusBadge(status: ItemStatus) {
  switch (status) {
    case "AVAILABLE":
      return <Badge variant="default">Available</Badge>;
    case "DAMAGED":
      return <Badge variant="destructive">Damaged</Badge>;
    case "RETIRED":
      return <Badge variant="secondary">Retired</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

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

  const [items, categories, stats] = await Promise.all([
    getItems({ search, categoryId, status }),
    getCategories(),
    getInventoryStats(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
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
        <StatCard
          label="Total"
          value={stats.total}
          icon={PackageIcon}
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={CheckCircleIcon}
          className="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Damaged"
          value={stats.damaged}
          icon={AlertTriangleIcon}
          className="text-destructive"
        />
        <StatCard
          label="Retired"
          value={stats.retired}
          icon={ArchiveIcon}
          className="text-muted-foreground"
        />
        <StatCard
          label="Out"
          value={stats.out}
          icon={TruckIcon}
          className="text-blue-600 dark:text-blue-400"
        />
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
        {items.length} item{items.length !== 1 ? "s" : ""} found
      </p>

      {/* Item grid */}
      {items.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <PackageIcon className="size-10 text-muted-foreground" />
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item: InventoryItem) => (
            <Link
              key={item.id}
              href={`/inventory/${item.id}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:ring-2 hover:ring-primary/20">
                {/* Image placeholder */}
                <div className="flex h-36 items-center justify-center bg-muted/50">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="size-full object-cover"
                    />
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
                      <p className="text-xs text-muted-foreground">
                        {item.tag}
                      </p>
                    </div>
                    {statusBadge(item.status)}
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{item.category?.name ?? "Uncategorized"}</span>
                    <span className="font-medium text-foreground">
                      {formatNGN.format(Number(item.rentalPrice))}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <Card size="sm">
      <CardContent className="flex items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className={`size-4 ${className ?? "text-muted-foreground"}`} />
        </div>
        <div>
          <p className="text-lg font-bold leading-none">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
