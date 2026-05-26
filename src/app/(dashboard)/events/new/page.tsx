import Link from "next/link";
import { getCustomers } from "@/lib/actions/customers";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { EventForm } from "@/components/events/event-form";

type CustomerEntry = Awaited<ReturnType<typeof getCustomers>>[number];

export default async function NewEventPage() {
  const customers = await getCustomers();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            New Event
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a new event and start allocating items
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>
            Fill in the event information. You can allocate items after
            creating the event.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventForm
            customers={customers.map((c: CustomerEntry) => ({
              id: c.id,
              name: c.name,
              phone: c.phone,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
