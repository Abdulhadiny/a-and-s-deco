import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/actions/customers";
import { EventStatus } from "@/generated/prisma";
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
import { CustomerForm } from "@/components/customers/customer-form";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PackageIcon,
  StickyNoteIcon,
} from "lucide-react";
import { format } from "date-fns";

type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
type EventEntry = CustomerDetail["events"][number];

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

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href="/customers" />}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to customers</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              {customer.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customer.events.length} event
              {customer.events.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Customer info */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                {customer.phone && (
                  <>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="size-4 text-muted-foreground" />
                      <dd className="font-medium">{customer.phone}</dd>
                    </div>
                    <Separator />
                  </>
                )}
                {customer.email && (
                  <>
                    <div className="flex items-center gap-2">
                      <MailIcon className="size-4 text-muted-foreground" />
                      <dd className="font-medium">{customer.email}</dd>
                    </div>
                    <Separator />
                  </>
                )}
                {customer.address && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPinIcon className="size-4 text-muted-foreground" />
                      <dd className="font-medium">{customer.address}</dd>
                    </div>
                    <Separator />
                  </>
                )}
                {customer.notes && (
                  <div className="flex flex-col gap-1">
                    <dt className="flex items-center gap-2 text-muted-foreground">
                      <StickyNoteIcon className="size-4" />
                      Notes
                    </dt>
                    <dd className="text-foreground">{customer.notes}</dd>
                  </div>
                )}
                {!customer.phone &&
                  !customer.email &&
                  !customer.address &&
                  !customer.notes && (
                    <p className="py-2 text-center text-muted-foreground">
                      No contact details on file.
                    </p>
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
              <CardTitle>Edit Customer</CardTitle>
              <CardDescription>
                Update customer name, contact details, and notes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerForm
                customer={{
                  id: customer.id,
                  name: customer.name,
                  phone: customer.phone,
                  email: customer.email,
                  address: customer.address,
                  notes: customer.notes,
                }}
                mode="edit"
              />
            </CardContent>
          </Card>

          {/* Event history */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDaysIcon className="size-4" />
                Event History ({customer.events.length})
              </CardTitle>
              <CardDescription>
                All events associated with this customer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {customer.events.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  No events yet for this customer.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {customer.events.map((event: EventEntry) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {event.title}
                        </span>
                        <span className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="size-3" />
                            {format(new Date(event.eventDate), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <PackageIcon className="size-3" />
                            {event._count.eventItems} item
                            {event._count.eventItems !== 1 ? "s" : ""}
                          </span>
                        </span>
                      </div>
                      {statusBadge(event.status)}
                    </Link>
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
