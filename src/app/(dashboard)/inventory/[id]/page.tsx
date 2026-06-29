import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, getCategories } from "@/lib/actions/inventory";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ItemEditForm } from "@/components/inventory/item-edit-form";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeftIcon,
  ImageIcon,
  CalendarDaysIcon,
  TagIcon,
} from "lucide-react";
import { format } from "date-fns";

type ItemDetail = NonNullable<Awaited<ReturnType<typeof getItem>>>;
type EventItemEntry = ItemDetail["eventItems"][number];
type CategoryEntry = Awaited<ReturnType<typeof getCategories>>[number];

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [item, categories] = await Promise.all([
    getItem(id),
    getCategories(),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back button and header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" render={<Link href="/inventory" />}>
            <ArrowLeftIcon />
            <span className="sr-only">Back to inventory</span>
          </Button>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-normal tracking-tight text-foreground">
              {item.name}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TagIcon className="size-3" />
              {item.tag}
            </p>
          </div>
        </div>
        <StatusBadge status={item.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Image */}
          <Card className="shadow-sm">
            <CardContent>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
                ) : (
                  <ImageIcon className="size-16 text-muted-foreground/30" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">{item.category?.name ?? "Uncategorized"}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rental Price</dt>
                  <dd className="font-medium tabular-nums">{formatNGN.format(Number(item.rentalPrice))}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd><StatusBadge status={item.status} /></dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">{format(new Date(item.createdAt), "MMM d, yyyy")}</dd>
                </div>
                {item.description && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Description</dt>
                      <dd className="text-foreground">{item.description}</dd>
                    </div>
                  </>
                )}
                {item.conditionNotes && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Condition Notes</dt>
                      <dd className="text-foreground">{item.conditionNotes}</dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Edit form */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Edit Item</CardTitle>
              <CardDescription>Update item details, status, and condition.</CardDescription>
            </CardHeader>
            <CardContent>
              <ItemEditForm
                item={{
                  id: item.id,
                  name: item.name,
                  tag: item.tag,
                  categoryId: item.categoryId,
                  rentalPrice: Number(item.rentalPrice),
                  description: item.description,
                  imageUrl: item.imageUrl,
                  status: item.status,
                  conditionNotes: item.conditionNotes,
                }}
                categories={categories.map((c: CategoryEntry) => ({ id: c.id, name: c.name }))}
              />
            </CardContent>
          </Card>

          {/* Recent event history */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-info/10">
                  <CalendarDaysIcon className="size-4 text-info" />
                </div>
                <CardTitle>Recent Event History</CardTitle>
              </div>
              <CardDescription>Last 10 events this item was assigned to</CardDescription>
            </CardHeader>
            <CardContent>
              {item.eventItems.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <CalendarDaysIcon className="size-6 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    This item has not been assigned to any events yet.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-border">
                  {item.eventItems.map((ei: EventItemEntry) => (
                    <div
                      key={ei.id}
                      className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{ei.event.title}</span>
                        <span className="text-xs text-muted-foreground">{ei.event.customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Allocated {format(new Date(ei.allocatedAt), "MMM d, yyyy")}
                        </span>
                        <StatusBadge status={ei.returnedAt ? "returned" : "out"} />
                        {ei.returnCondition && ei.returnCondition !== "GOOD" && (
                          <StatusBadge status={ei.returnCondition.toLowerCase()} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
