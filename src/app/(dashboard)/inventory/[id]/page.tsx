import Link from "next/link";
import { notFound } from "next/navigation";
import { getItem, getCategories } from "@/lib/actions/inventory";
import { ItemStatus } from "@/generated/prisma";
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
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/inventory" />}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to inventory</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              {item.name}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <TagIcon className="size-3" />
              {item.tag}
            </p>
          </div>
        </div>
        {statusBadge(item.status)}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Item info display */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Image */}
          <Card>
            <CardContent>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-muted/50">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-16 text-muted-foreground/30" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick info */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Category</dt>
                  <dd className="font-medium">
                    {item.category?.name ?? "Uncategorized"}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Rental Price</dt>
                  <dd className="font-medium">
                    {formatNGN.format(Number(item.rentalPrice))}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Status</dt>
                  <dd>{statusBadge(item.status)}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Created</dt>
                  <dd className="font-medium">
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </dd>
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
                      <dt className="text-muted-foreground">
                        Condition Notes
                      </dt>
                      <dd className="text-foreground">
                        {item.conditionNotes}
                      </dd>
                    </div>
                  </>
                )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Edit form + Event history */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Edit form */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Item</CardTitle>
              <CardDescription>
                Update item details, status, and condition.
              </CardDescription>
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
                categories={categories.map((c: CategoryEntry) => ({
                  id: c.id,
                  name: c.name,
                }))}
              />
            </CardContent>
          </Card>

          {/* Recent event history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4" />
                Recent Event History
              </CardTitle>
              <CardDescription>
                Last 10 events this item was assigned to
              </CardDescription>
            </CardHeader>
            <CardContent>
              {item.eventItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  This item has not been assigned to any events yet.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {item.eventItems.map((ei: EventItemEntry) => (
                    <div
                      key={ei.id}
                      className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {ei.event.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {ei.event.customer.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground">
                          Allocated{" "}
                          {format(
                            new Date(ei.allocatedAt),
                            "MMM d, yyyy",
                          )}
                        </span>
                        {ei.returnedAt ? (
                          <Badge variant="secondary">
                            Returned{" "}
                            {format(
                              new Date(ei.returnedAt),
                              "MMM d",
                            )}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Out</Badge>
                        )}
                        {ei.returnCondition && (
                          <Badge
                            variant={
                              ei.returnCondition === "GOOD"
                                ? "default"
                                : ei.returnCondition === "DAMAGED"
                                  ? "destructive"
                                  : "secondary"
                            }
                          >
                            {ei.returnCondition === "GOOD"
                              ? "Good"
                              : ei.returnCondition === "DAMAGED"
                                ? "Damaged"
                                : "Missing"}
                          </Badge>
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
