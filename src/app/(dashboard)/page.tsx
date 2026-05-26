import { getDashboardData } from "@/lib/actions/dashboard";
import {
  Card,
  CardContent,
  CardDescription,
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
} from "lucide-react";
import { format } from "date-fns";

type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
type WeekEvent = DashboardData["thisWeekEvents"][number];
type ItemOut = DashboardData["itemsOut"][number];
type DamagedItem = DashboardData["damagedItems"][number];

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight md:text-2xl">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of your operations
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Items"
          value={data.totalItems}
          description="Active inventory"
          icon={PackageIcon}
        />
        <StatCard
          title="Available"
          value={data.availableItems}
          description={`of ${data.totalItems} items`}
          icon={CheckCircleIcon}
        />
        <StatCard
          title="Events This Month"
          value={data.monthEventCount}
          description={`${data.upcomingEvents} upcoming`}
          icon={CalendarDaysIcon}
        />
        <StatCard
          title="Customers"
          value={data.totalCustomers}
          description="Total registered"
          icon={UsersIcon}
        />
      </div>

      {/* This week's events */}
      <Card>
        <CardHeader>
          <CardTitle>This Week&apos;s Events</CardTitle>
          <CardDescription>
            Events scheduled for the current week
          </CardDescription>
        </CardHeader>
        <CardContent>
          {data.thisWeekEvents.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No events scheduled this week.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {data.thisWeekEvents.map((event: WeekEvent) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-1 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{event.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {event.customer.name} &middot;{" "}
                      {format(new Date(event.eventDate), "EEE, MMM d 'at' h:mm a")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {event._count.eventItems} items
                    </Badge>
                    <Badge
                      variant={
                        event.status === "IN_PROGRESS" ? "default" : "outline"
                      }
                    >
                      {event.status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Upcoming"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Items currently out */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TruckIcon className="size-4" />
              Items Out
            </CardTitle>
            <CardDescription>
              Items currently assigned to events and not yet returned
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.itemsOut.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No items currently out.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.itemsOut.slice(0, 10).map((ei: ItemOut) => (
                  <div
                    key={ei.id}
                    className="flex items-center justify-between rounded-lg border p-2.5 text-sm"
                  >
                    <div>
                      <span className="font-medium">{ei.item.name}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {ei.item.category?.name}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ei.event.title}
                    </span>
                  </div>
                ))}
                {data.itemsOut.length > 10 && (
                  <p className="pt-1 text-center text-xs text-muted-foreground">
                    +{data.itemsOut.length - 10} more items
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Damaged items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="size-4 text-destructive" />
              Damaged Items
            </CardTitle>
            <CardDescription>
              Items marked as damaged that need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.damagedItems.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No damaged items. All good!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.damagedItems.map((item: DamagedItem) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-2.5 text-sm"
                  >
                    <span className="font-medium">{item.name}</span>
                    <Badge variant="destructive" className="text-xs">
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
}: {
  title: string;
  value: number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-medium text-muted-foreground">
              {title}
            </span>
            <span className="text-2xl font-bold tracking-tight">{value}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </div>
          <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
