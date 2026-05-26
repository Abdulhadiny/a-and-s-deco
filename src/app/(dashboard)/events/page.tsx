import Link from "next/link";
import { getEvents, getEventsForMonth } from "@/lib/actions/events";
import { EventStatus, EventType } from "@/generated/prisma";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { EventCalendar } from "@/components/events/event-calendar";
import {
  CalendarDaysIcon,
  PlusIcon,
  MapPinIcon,
  UserIcon,
  PackageIcon,
} from "lucide-react";
import { format } from "date-fns";

type EventEntry = Awaited<ReturnType<typeof getEvents>>[number];
type CalendarEventEntry = Awaited<ReturnType<typeof getEventsForMonth>>[number];

function eventTypeBadge(eventType: string) {
  switch (eventType) {
    case "WEDDING":
      return (
        <Badge className="bg-pink-500/10 text-pink-700 dark:text-pink-400">
          Wedding
        </Badge>
      );
    case "NAMING":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          Naming
        </Badge>
      );
    case "BIRTHDAY":
      return (
        <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400">
          Birthday
        </Badge>
      );
    case "GRADUATION":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
          Graduation
        </Badge>
      );
    default:
      return <Badge variant="secondary">Other</Badge>;
  }
}

function statusBadge(status: EventStatus) {
  switch (status) {
    case "UPCOMING":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          Upcoming
        </Badge>
      );
    case "IN_PROGRESS":
      return (
        <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          In Progress
        </Badge>
      );
    case "COMPLETED":
      return <Badge variant="default">Completed</Badge>;
    case "CANCELLED":
      return <Badge variant="destructive">Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
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
    typeof params.year === "string"
      ? parseInt(params.year, 10)
      : now.getFullYear();
  const month =
    typeof params.month === "string"
      ? parseInt(params.month, 10)
      : now.getMonth();

  const [calendarEvents, upcomingEvents] = await Promise.all([
    getEventsForMonth(year, month),
    getEvents({ status: "UPCOMING" as EventStatus }),
  ]);

  // Serialize dates for the client calendar component
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
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
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
      <EventCalendar
        events={calendarData}
        initialYear={year}
        initialMonth={month}
      />

      <Separator />

      {/* Upcoming events list */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <h2 className="text-base font-medium">
            Upcoming Events ({upcomingEvents.length})
          </h2>
        </div>

        {upcomingEvents.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <CalendarDaysIcon className="size-10 text-muted-foreground" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event: EventEntry) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="group"
              >
                <Card className="h-full transition-shadow hover:ring-2 hover:ring-primary/20">
                  <CardContent className="flex flex-col gap-3">
                    {/* Title & badges */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {event.title}
                      </p>
                      {eventTypeBadge(event.eventType)}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDaysIcon className="size-3" />
                      {format(new Date(event.eventDate), "EEE, MMM d, yyyy")}
                    </div>

                    {/* Customer */}
                    {event.customer && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <UserIcon className="size-3" />
                        {event.customer.name}
                      </div>
                    )}

                    {/* Venue */}
                    {event.venue && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPinIcon className="size-3" />
                        <span className="truncate">{event.venue}</span>
                      </div>
                    )}

                    {/* Status & item count */}
                    <div className="flex items-center justify-between">
                      {statusBadge(event.status)}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <PackageIcon className="size-3" />
                        {event._count.eventItems} item
                        {event._count.eventItems !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
