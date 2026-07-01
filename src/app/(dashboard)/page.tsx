import { getDashboardData } from "@/lib/actions/dashboard";
import { auth } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/shared/stat-card";
import {
  TrendingUpIcon,
  BanknoteIcon,
  CalendarDaysIcon,
  PackageIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
  SunIcon,
  ReceiptIcon,
} from "lucide-react";
import { format } from "date-fns";
import { formatCompactCurrency, formatCurrency } from "@/lib/utils/currency";
import Link from "next/link";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type WeekEvent = DashboardData["thisWeekEvents"][number];
type TodayEvent = DashboardData["todayEvents"][number];
type ItemOut = DashboardData["itemsOut"][number];
type OutstandingQuote = DashboardData["topOutstandingQuotes"][number];
type DamageItem = DashboardData["damageAwaiting"][number];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const [data, session] = await Promise.all([getDashboardData(), auth()]);
  const userName = (session?.user as any)?.name ?? "there";
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const revenueMTD = parseFloat(data.revenueMTD?.toString() ?? "0");
  const outstandingBalance =
    parseFloat(data.outstandingBalance.total?.toString() ?? "0") -
    parseFloat(data.outstandingBalance.amountPaid?.toString() ?? "0");

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground">
            {getGreeting()},{" "}
            <span className="text-primary">{userName}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your operations today.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2 shadow-sm shrink-0">
          <CalendarDaysIcon className="size-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">
            {format(today, "EEE, MMM d yyyy")}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Revenue MTD"
          value={formatCompactCurrency(revenueMTD)}
          tooltip={formatCurrency(revenueMTD)}
          icon={TrendingUpIcon}
          color="teal"
          description="This month"
        />
        <StatCard
          title="Outstanding"
          value={formatCompactCurrency(outstandingBalance)}
          tooltip={formatCurrency(outstandingBalance)}
          icon={BanknoteIcon}
          color="rose"
          description="Unpaid balance"
        />
        <StatCard
          title="Events This Month"
          value={data.monthEventCount}
          description={`${data.upcomingEvents} upcoming`}
          icon={CalendarDaysIcon}
          color="blue"
        />
        <StatCard
          title="Available Items"
          value={data.availableItems}
          description={`of ${data.totalItems} in stock`}
          icon={PackageIcon}
          color="green"
        />
      </div>

      {/* Today's Activity */}
      {data.todayEvents.length > 0 && (
        <Card className="shadow-sm border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10">
                  <SunIcon className="size-4 text-amber-500" />
                </div>
                <CardTitle className="text-base font-semibold">Today&apos;s Activity</CardTitle>
              </div>
              <Badge className="text-xs border bg-amber-500/15 text-amber-600 border-amber-500/30">
                {data.todayEvents.length} {data.todayEvents.length === 1 ? "event" : "events"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border">
              {data.todayEvents.map((event: TodayEvent) => {
                const evDateStr = format(new Date(event.eventDate), "yyyy-MM-dd");
                const setupDateStr = event.setupDate
                  ? format(new Date(event.setupDate), "yyyy-MM-dd")
                  : null;
                const returnDateStr = event.returnDate
                  ? format(new Date(event.returnDate), "yyyy-MM-dd")
                  : null;

                const isSetupDay = setupDateStr === todayStr;
                const isEventDay = evDateStr === todayStr;
                const isReturnDay = returnDateStr === todayStr;

                return (
                  <div
                    key={event.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
                        <ClockIcon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-foreground">
                          {event.title}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {event.customer.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0 flex-wrap">
                      {isSetupDay && (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-violet-500/10 text-violet-500 ring-1 ring-inset ring-violet-500/30">
                          Setup Day
                        </span>
                      )}
                      {isEventDay && (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-600 ring-1 ring-inset ring-amber-500/30">
                          Event Day
                        </span>
                      )}
                      {isReturnDay && (
                        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-teal-500/10 text-teal-600 ring-1 ring-inset ring-teal-500/30">
                          Return Day
                        </span>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {event._count.eventItems} items
                      </Badge>
                      <EventStatusBadge status={event.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* This week's events */}
      <Card className="shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              This Week&apos;s Events
            </CardTitle>
            <Badge variant="secondary" className="text-xs font-medium">
              {data.thisWeekEvents.length} events
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {data.thisWeekEvents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <CalendarDaysIcon className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No events scheduled this week.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {data.thisWeekEvents.map((event: WeekEvent) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between first:pt-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted mt-0.5">
                      <ClockIcon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">
                        {event.title}
                      </span>
                      <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                        <span className="text-xs text-muted-foreground">
                          {event.customer.name} &middot;{" "}
                          {format(new Date(event.eventDate), "EEE, MMM d 'at' h:mm a")}
                        </span>
                        {event.setupDate && (
                          <span className="text-xs text-muted-foreground/60">
                            &middot; Setup: {format(new Date(event.setupDate), "EEE MMM d")}
                          </span>
                        )}
                        {event.returnDate && (
                          <span className="text-xs text-muted-foreground/60">
                            &middot; Return: {format(new Date(event.returnDate), "EEE MMM d")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0">
                    <Badge variant="secondary" className="text-xs">
                      {event._count.eventItems} items
                    </Badge>
                    <EventStatusBadge status={event.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Out + Outstanding Payments */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Items currently out */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-info/10">
                  <TruckIcon className="size-4 text-info" />
                </div>
                <CardTitle className="text-base font-semibold">Items Out</CardTitle>
              </div>
              {data.itemsOut.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {data.itemsOut.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.itemsOut.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircleIcon className="size-6 text-success/60" />
                <p className="text-sm text-muted-foreground">
                  No items currently out.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.itemsOut.map((ei: ItemOut) => {
                  const returnDateStr = ei.event.returnDate
                    ? format(new Date(ei.event.returnDate), "yyyy-MM-dd")
                    : null;
                  const isOverdue = returnDateStr !== null && returnDateStr < todayStr;

                  return (
                    <div
                      key={ei.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {ei.item.name}
                        </span>
                        {ei.item.category?.name && (
                          <span className="text-xs text-muted-foreground">
                            {ei.item.category.name}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md truncate max-w-[130px]">
                          {ei.event.title}
                        </span>
                        {isOverdue ? (
                          <Badge variant="destructive" className="text-xs">
                            OVERDUE
                          </Badge>
                        ) : ei.event.returnDate ? (
                          <span className="text-xs text-muted-foreground/70">
                            Return: {format(new Date(ei.event.returnDate), "EEE MMM d")}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Outstanding Payments */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-500/10">
                  <ReceiptIcon className="size-4 text-rose-500" />
                </div>
                <CardTitle className="text-base font-semibold">Outstanding Payments</CardTitle>
              </div>
              {data.topOutstandingQuotes.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.topOutstandingQuotes.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.topOutstandingQuotes.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircleIcon className="size-6 text-success/60" />
                <p className="text-sm text-muted-foreground">
                  All payments reconciled.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.topOutstandingQuotes.map((quote: OutstandingQuote) => {
                  const remaining =
                    parseFloat(quote.total.toString()) -
                    parseFloat(quote.amountPaid.toString());
                  return (
                    <div
                      key={quote.id}
                      className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {quote.event.customer.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {quote.event.title}
                        </span>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 shrink-0 ml-2">
                        <span className="text-sm font-semibold text-rose-500">
                          {formatCompactCurrency(remaining)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          of {formatCompactCurrency(parseFloat(quote.total.toString()))}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Damage Awaiting Resolution */}
      <Card className="shadow-sm border-destructive/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
                <AlertTriangleIcon className="size-4 text-destructive" />
              </div>
              <CardTitle className="text-base font-semibold">
                Damage Awaiting Resolution
              </CardTitle>
            </div>
            {data.damageAwaiting.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {data.damageAwaiting.length}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {data.damageAwaiting.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <CheckCircleIcon className="size-6 text-success/60" />
              <p className="text-sm text-muted-foreground">
                All clear — no damage awaiting resolution.
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {data.damageAwaiting.map((ei: DamageItem) => (
                <div
                  key={ei.id}
                  className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-foreground">
                      {ei.item.name}
                    </span>
                    <span className="text-xs text-muted-foreground truncate">
                      {ei.event.customer.name} &middot; {ei.event.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        ei.returnCondition === "MISSING"
                          ? "text-orange-500 border-orange-500/30"
                          : "text-destructive border-destructive/30"
                      }`}
                    >
                      {ei.returnCondition}
                    </Badge>
                    <Link
                      href={`/events/${ei.event.id}`}
                      className="text-xs text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EventStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning ring-1 ring-inset ring-warning/30">
          In Progress
        </span>
      );
    case "UPCOMING":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-info/10 text-info ring-1 ring-inset ring-info/30">
          Upcoming
        </span>
      );
    case "COMPLETED":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-success/10 text-success ring-1 ring-inset ring-success/30">
          Completed
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/30">
          Cancelled
        </span>
      );
    default:
      return (
        <Badge variant="secondary" className="text-xs">
          {status}
        </Badge>
      );
  }
}
