import { getDashboardData } from "@/lib/actions/dashboard";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PackageIcon,
  CalendarDaysIcon,
  UsersIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  TruckIcon,
  ClockIcon,
} from "lucide-react";
import { format } from "date-fns";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type WeekEvent = DashboardData["thisWeekEvents"][number];
type ItemOut = DashboardData["itemsOut"][number];
type DamagedItem = DashboardData["damagedItems"][number];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  const today = new Date();

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-normal tracking-tight text-foreground">
            {getGreeting()},{" "}
            <span className="text-primary">A&S Deco</span>
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
          title="Total Inventory"
          value={data.totalItems}
          description="Active items"
          icon={PackageIcon}
          color="amber"
        />
        <StatCard
          title="Available"
          value={data.availableItems}
          description={`of ${data.totalItems} in stock`}
          icon={CheckCircleIcon}
          color="emerald"
        />
        <StatCard
          title="Events This Month"
          value={data.monthEventCount}
          description={`${data.upcomingEvents} upcoming`}
          icon={CalendarDaysIcon}
          color="blue"
        />
        <StatCard
          title="Customers"
          value={data.totalCustomers}
          description="Total registered"
          icon={UsersIcon}
          color="violet"
        />
      </div>

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
                      <span className="text-xs text-muted-foreground">
                        {event.customer.name} &middot;{" "}
                        {format(new Date(event.eventDate), "EEE, MMM d 'at' h:mm a")}
                      </span>
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
                {data.itemsOut.slice(0, 10).map((ei: ItemOut) => (
                  <div
                    key={ei.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-foreground">
                        {ei.item.name}
                      </span>
                      {ei.item.category?.name && (
                        <span className="text-xs text-muted-foreground">
                          {ei.item.category.name}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md truncate max-w-[130px]">
                      {ei.event.title}
                    </span>
                  </div>
                ))}
                {data.itemsOut.length > 10 && (
                  <p className="pt-3 text-center text-xs text-muted-foreground">
                    +{data.itemsOut.length - 10} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Damaged items */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-destructive/10">
                  <AlertTriangleIcon className="size-4 text-destructive" />
                </div>
                <CardTitle className="text-base font-semibold">Damaged Items</CardTitle>
              </div>
              {data.damagedItems.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {data.damagedItems.length}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {data.damagedItems.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <CheckCircleIcon className="size-6 text-success/60" />
                <p className="text-sm text-muted-foreground">
                  No damaged items. All good!
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {data.damagedItems.map((item: DamagedItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0"
                  >
                    <span className="text-sm font-medium text-foreground">
                      {item.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs text-destructive border-destructive/30"
                    >
                      {item.category?.name ?? "Uncategorized"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: "amber" | "emerald" | "blue" | "violet";
}) {
  const colorMap = {
    amber: { iconBg: "bg-primary/10", iconColor: "text-primary" },
    emerald: { iconBg: "bg-success/10", iconColor: "text-success" },
    blue: { iconBg: "bg-info/10", iconColor: "text-info" },
    violet: { iconBg: "bg-violet/10", iconColor: "text-violet" },
  };

  const { iconBg, iconColor } = colorMap[color];

  return (
    <Card className="shadow-sm">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </span>
            <span className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
            <Icon className={`size-5 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
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
