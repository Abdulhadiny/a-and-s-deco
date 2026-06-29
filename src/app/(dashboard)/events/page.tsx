import Link from "next/link";
import { getEvents, getEventsForMonth } from "@/lib/actions/events";
import { EventStatus, EventType } from "@/generated/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventCalendar } from "@/components/events/event-calendar";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  CalendarDaysIcon,
  PlusIcon,
  MapPinIcon,
  UserIcon,
  PackageIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { format } from "date-fns";

type EventEntry = Awaited<ReturnType<typeof getEvents>>["items"][number];
type CalendarEventEntry = Awaited<ReturnType<typeof getEventsForMonth>>[number];

const PAGE_SIZE = 12;

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

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;

  const now = new Date();
  const year =
    typeof params.year === "string" ? parseInt(params.year, 10) : now.getFullYear();
  const month =
    typeof params.month === "string" ? parseInt(params.month, 10) : now.getMonth();
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const [calendarEvents, { items: upcomingEvents, total }] = await Promise.all([
    getEventsForMonth(year, month),
    getEvents({ status: "UPCOMING" as EventStatus, page, pageSize: PAGE_SIZE }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildPageHref(p: number) {
    const qs = new URLSearchParams();
    if (params.year) qs.set("year", String(year));
    if (params.month) qs.set("month", String(month));
    if (p > 1) qs.set("page", String(p));
    const str = qs.toString();
    return `/events${str ? `?${str}` : ""}`;
  }

  const calendarData = calendarEvents.map((ev: CalendarEventEntry) => ({
    id: ev.id,
    title: ev.title,
    eventDate: ev.eventDate.toISOString(),
    eventType: ev.eventType,
    status: ev.status,
    customer: ev.customer ? { id: ev.customer.id, name: ev.customer.name } : null,
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-normal tracking-tight text-foreground">
            Events
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage upcoming events, allocate items, and track returns
          </p>
        </div>
        <Button render={<Link href="/events/new" />}>
          <PlusIcon />
          New Event
        </Button>
      </div>

      {/* Calendar */}
      <EventCalendar events={calendarData} initialYear={year} initialMonth={month} />

      <Separator />

      {/* Upcoming events list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">
            Upcoming Events ({total})
          </h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDaysIcon className="size-10 text-muted-foreground/40" />
              <div>
                <p className="font-medium">No upcoming events</p>
                <p className="text-sm text-muted-foreground">
                  Create your first event to get started.
                </p>
              </div>
              <Button render={<Link href="/events/new" />} size="sm">
                <PlusIcon />
                New Event
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((event: EventEntry) => (
                <Link key={event.id} href={`/events/${event.id}`} className="group">
                  <Card className="h-full shadow-sm transition-shadow hover:ring-2 hover:ring-primary/20">
                    <CardContent className="flex flex-col gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="truncate text-sm font-semibold group-hover:text-primary">
                          {event.title}
                        </p>
                        {eventTypeBadge(event.eventType)}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDaysIcon className="size-3" />
                        {format(new Date(event.eventDate), "EEE, MMM d, yyyy")}
                      </div>

                      {event.customer && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <UserIcon className="size-3" />
                          {event.customer.name}
                        </div>
                      )}

                      {event.venue && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <MapPinIcon className="size-3" />
                          <span className="truncate">{event.venue}</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <StatusBadge status={event.status} />
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <PackageIcon className="size-3" />
                          {event._count.eventItems} item{event._count.eventItems !== 1 ? "s" : ""}
                        </div>
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
    </div>
  );
}
