import Link from "next/link";
import { notFound } from "next/navigation";
import { getEvent } from "@/lib/actions/events";
import { getCustomers } from "@/lib/actions/customers";
import { getAvailableItems } from "@/lib/availability";
import { QuoteType } from "@/generated/prisma";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { EventForm } from "@/components/events/event-form";
import { AllocateItemsDialog } from "@/components/events/allocate-items-dialog";
import { ReturnItems } from "@/components/events/return-items";
import { DamageReconciliation } from "@/components/events/damage-reconciliation";
import { EventStatusActions } from "./event-status-actions";
import { DeallocateButton } from "./deallocate-button";
import { GenerateQuoteButton } from "./generate-quote-button";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MapPinIcon,
  UserIcon,
  PackageIcon,
  FileTextIcon,
  ClockIcon,
  UndoIcon,
} from "lucide-react";
import { format } from "date-fns";

type EventDetail = NonNullable<Awaited<ReturnType<typeof getEvent>>>;
type EventItemEntry = EventDetail["eventItems"][number];
type QuoteEntry = EventDetail["quotes"][number];
type CustomerEntry = Awaited<ReturnType<typeof getCustomers>>["customers"][number];
type AvailableItemEntry = Awaited<ReturnType<typeof getAvailableItems>>[number];

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function eventTypeBadge(eventType: string) {
  switch (eventType) {
    case "WEDDING":
      return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-violet/10 text-violet ring-1 ring-inset ring-violet/20">Wedding</span>;
    case "NAMING":
      return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-info/10 text-info ring-1 ring-inset ring-info/20">Naming</span>;
    case "BIRTHDAY":
      return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning ring-1 ring-inset ring-warning/20">Birthday</span>;
    case "GRADUATION":
      return <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-success/10 text-success ring-1 ring-inset ring-success/20">Graduation</span>;
    default:
      return <Badge variant="secondary">Other</Badge>;
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [event, { customers }, locations] = await Promise.all([
    getEvent(id),
    getCustomers({ pageSize: 1000 }),
    import("@/lib/db").then((m) => m.db.location.findMany({ where: { isActive: true }, orderBy: { name: "asc" } })),
  ]);

  if (!event) {
    notFound();
  }

  const rentalQuotes = event.quotes.filter((q) => q.type === QuoteType.RENTAL);
  const damageQuote = event.quotes.find((q) => q.type === QuoteType.DAMAGE);
  const damageItems = event.eventItems.filter(
    (ei) =>
      ei.returnedAt &&
      (ei.returnCondition === "DAMAGED" || ei.returnCondition === "MISSING")
  );

  // Fetch available items for allocation (default location: main-warehouse)
  const availableItems = await getAvailableItems(
    event.eventDate,
    undefined,
    event.id
  );

  const showReturnSection =
    event.status === "IN_PROGRESS" || event.status === "COMPLETED";
  const canAllocate =
    event.status === "UPCOMING" || event.status === "IN_PROGRESS";

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/events" />}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to events</span>
          </Button>
          <div>
            <h1 className="font-heading text-2xl md:text-3xl font-normal tracking-tight text-foreground">
              {event.title}
            </h1>
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDaysIcon className="size-3" />
              {format(new Date(event.eventDate), "EEE, MMM d, yyyy")}
              {event.customer && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <UserIcon className="size-3" />
                  {event.customer.name}
                </>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {eventTypeBadge(event.eventType)}
          <StatusBadge status={event.status} />
        </div>
      </div>

      {/* Status actions */}
      <EventStatusActions eventId={event.id} currentStatus={event.status} />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Event info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Quick info card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Event Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Customer</dt>
                  <dd className="font-medium">
                    {event.customer?.name ?? "Unknown"}
                  </dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Event Date</dt>
                  <dd className="font-medium">
                    {format(new Date(event.eventDate), "MMM d, yyyy")}
                  </dd>
                </div>
                {event.setupDate && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Setup Date</dt>
                      <dd className="font-medium">
                        {format(new Date(event.setupDate), "MMM d, yyyy")}
                      </dd>
                    </div>
                  </>
                )}
                {event.returnDate && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Return Date</dt>
                      <dd className="font-medium">
                        {format(new Date(event.returnDate), "MMM d, yyyy")}
                      </dd>
                    </div>
                  </>
                )}
                {event.venue && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Venue</dt>
                      <dd className="font-medium">{event.venue}</dd>
                    </div>
                  </>
                )}
                {event.notes && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-1">
                      <dt className="text-muted-foreground">Notes</dt>
                      <dd className="text-foreground">{event.notes}</dd>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Items</dt>
                  <dd className="font-medium">{event.eventItems.length}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Quotes</dt>
                  <dd className="font-medium">{rentalQuotes.length}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Quotes section */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileTextIcon className="size-4" />
                  Quotes
                </CardTitle>
                <GenerateQuoteButton
                  eventId={event.id}
                  hasItems={event.eventItems.length > 0}
                />
              </div>
              <CardDescription>
                Quotes generated from allocated items
              </CardDescription>
            </CardHeader>
            <CardContent>
              {rentalQuotes.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No quotes yet.{" "}
                  {event.eventItems.length > 0
                    ? "Generate a quote from allocated items."
                    : "Allocate items first, then generate a quote."}
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {rentalQuotes.map((quote: QuoteEntry) => (
                    <Link
                      key={quote.id}
                      href={`/quotes/${quote.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {formatNGN.format(Number(quote.total))}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {quote.lines.length} line
                          {quote.lines.length !== 1 ? "s" : ""} &middot;{" "}
                          {format(new Date(quote.createdAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <StatusBadge status={quote.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <DamageReconciliation
            eventId={event.id}
            eventStatus={event.status}
            damageItems={damageItems.map((ei) => ({
              id: ei.id,
              item: { name: ei.item.name, tag: ei.item.tag },
              returnCondition: ei.returnCondition!,
              damageNotes: ei.damageNotes,
            }))}
            damageQuote={
              damageQuote
                ? {
                    id: damageQuote.id,
                    total: Number(damageQuote.total),
                    status: damageQuote.status,
                    paymentStatus: damageQuote.paymentStatus,
                  }
                : undefined
            }
          />
        </div>

        {/* Right column: Allocated items, Allocate, Return */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Edit form (collapsible via details) */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Edit Event</CardTitle>
              <CardDescription>
                Update event details, dates, and venue information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EventForm
                customers={customers.map((c: CustomerEntry) => ({
                  id: c.id,
                  name: c.name,
                  phone: c.phone,
                }))}
                event={{
                  id: event.id,
                  customerId: event.customerId,
                  title: event.title,
                  eventType: event.eventType,
                  eventDate: event.eventDate,
                  setupDate: event.setupDate,
                  returnDate: event.returnDate,
                  venue: event.venue,
                  notes: event.notes,
                }}
                mode="edit"
              />
            </CardContent>
          </Card>

          {/* Allocated Items */}
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <PackageIcon className="size-4" />
                  Allocated Items ({event.eventItems.length})
                </CardTitle>
                {canAllocate && (
                  <AllocateItemsDialog
                    eventId={event.id}
                    eventDate={new Date(event.eventDate).toISOString()}
                    availableItems={availableItems.map((item: AvailableItemEntry) => ({
                      id: item.id,
                      name: item.name,
                      tag: item.tag,
                      rentalPrice: Number(item.rentalPrice),
                      category: item.category
                        ? { id: item.category.id, name: item.category.name }
                        : null,
                    }))}
                    locations={locations}
                    alreadyAllocatedIds={event.eventItems.map(
                      (ei: EventItemEntry) => ei.itemId
                    )}
                  />
                )}
              </div>
              <CardDescription>
                Items assigned to this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {event.eventItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No items allocated yet. Use the &quot;Allocate Items&quot;
                  button to assign items.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tag</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Category
                      </TableHead>
                      <TableHead>Status</TableHead>
                      {canAllocate && <TableHead className="w-10" />}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {event.eventItems.map((ei: EventItemEntry) => (
                      <TableRow key={ei.id}>
                        <TableCell className="font-mono text-xs">
                          {ei.item.tag}
                        </TableCell>
                        <TableCell className="font-medium">
                          {ei.item.name}
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground sm:table-cell">
                          {ei.item.category?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={ei.returnedAt ? "returned" : "allocated"} />
                        </TableCell>
                        {canAllocate && (
                          <TableCell>
                            {!ei.returnedAt && (
                              <DeallocateButton
                                eventId={event.id}
                                itemId={ei.itemId}
                              />
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Return Items */}
          {showReturnSection && (
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UndoIcon className="size-4" />
                  Return Items
                </CardTitle>
                <CardDescription>
                  Record the condition of each item as it is returned.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ReturnItems
                  eventId={event.id}
                  locations={locations}
                  eventItems={event.eventItems.map((ei: EventItemEntry) => ({
                    id: ei.id,
                    itemId: ei.itemId,
                    returnedAt: ei.returnedAt,
                    returnCondition: ei.returnCondition,
                    damageNotes: ei.damageNotes,
                    item: {
                      id: ei.item.id,
                      name: ei.item.name,
                      tag: ei.item.tag,
                      category: ei.item.category
                        ? {
                            id: ei.item.category.id,
                            name: ei.item.category.name,
                          }
                        : null,
                    },
                  }))}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
