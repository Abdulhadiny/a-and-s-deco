"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createEvent, updateEvent } from "@/lib/actions/events";
import { createCustomer } from "@/lib/actions/customers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Loader2Icon,
  PlusIcon,
  SaveIcon,
  CalendarPlusIcon,
  UserPlusIcon,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { filterName } from "@/lib/input-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Customer {
  id: string;
  name: string;
  phone?: string | null;
}

interface EventData {
  id: string;
  customerId: string;
  title: string;
  eventType: string;
  eventDate: string | Date;
  setupDate?: string | Date | null;
  returnDate?: string | Date | null;
  venue?: string | null;
  notes?: string | null;
}

interface EventFormProps {
  customers: Customer[];
  event?: EventData;
  mode?: "create" | "edit";
}

const EVENT_TYPES = [
  { value: "WEDDING", label: "Wedding" },
  { value: "NAMING", label: "Naming Ceremony" },
  { value: "BIRTHDAY", label: "Birthday" },
  { value: "GRADUATION", label: "Graduation" },
  { value: "OTHER", label: "Other" },
];

function toDateInputValue(date: string | Date | null | undefined): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  // Format as YYYY-MM-DD for input[type=date]
  return d.toISOString().split("T")[0];
}

export function EventForm({
  customers: initialCustomers,
  event,
  mode = "create",
}: EventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [customers, setCustomers] = useState(initialCustomers);
  const [customerId, setCustomerId] = useState(event?.customerId ?? "");
  const [eventType, setEventType] = useState(event?.eventType ?? "");
  const [title, setTitle] = useState(event?.title ?? "");
  const [eventDate, setEventDate] = useState(toDateInputValue(event?.eventDate));
  const [setupDate, setSetupDate] = useState(toDateInputValue(event?.setupDate));
  const [returnDate, setReturnDate] = useState(toDateInputValue(event?.returnDate));
  const [venue, setVenue] = useState(event?.venue ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    formData.set("customerId", customerId);
    formData.set("eventType", eventType);

    if (!customerId) {
      setError("Please select a customer.");
      return;
    }
    if (!eventType) {
      setError("Please select an event type.");
      return;
    }

    setPendingFormData(formData);
    setShowConfirm(true);
  }

  function handleConfirmedSubmit() {
    if (!pendingFormData) return;
    setShowConfirm(false);
    startTransition(async () => {
      try {
        if (mode === "edit" && event) {
          await updateEvent(event.id, pendingFormData);
          setSuccess(true);
          router.refresh();
          setTimeout(() => setSuccess(false), 3000);
        } else {
          const created = await createEvent(pendingFormData);
          router.push(`/events/${created.id}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save event."
        );
      } finally {
        setPendingFormData(null);
      }
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Customer */}
        <div className="flex flex-col gap-1.5">
          <Label>Customer</Label>
          {mode === "edit" ? (
            <p className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
              {customers.find((c) => c.id === customerId)?.name ?? "—"}
            </p>
          ) : (
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={setCustomerId} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select customer">
                    {customers.find((c) => c.id === customerId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}{c.phone ? ` (${c.phone})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <NewCustomerDialog
                onCreated={(c) => {
                  setCustomers(
                    [...customers, c].sort((a, b) =>
                      a.name.localeCompare(b.name)
                    )
                  );
                  setCustomerId(c.id);
                }}
              />
            </div>
          )}
        </div>

        {/* Event Type */}
        <div className="flex flex-col gap-1.5">
          <Label>Event Type</Label>
          {mode === "edit" ? (
            <p className="flex h-8 items-center rounded-lg border border-input bg-muted/40 px-2.5 text-sm text-muted-foreground">
              {EVENT_TYPES.find((t) => t.value === eventType)?.label ?? eventType}
            </p>
          ) : (
            <Select value={eventType} onValueChange={setEventType} disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type">
                  {EVENT_TYPES.find((t) => t.value === eventType)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-title">Title</Label>
          <Input
            id="event-title"
            name="title"
            required
            disabled={isPending}
            value={title}
            onChange={(e) => setTitle(filterName(e.target.value))}
            placeholder="e.g. Amina & Ibrahim Wedding"
          />
        </div>

        {/* Event Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-date">Event Date</Label>
          <Input
            id="event-date"
            name="eventDate"
            type="date"
            required
            disabled={isPending}
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
          />
        </div>

        {/* Setup Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="setup-date">Setup Date</Label>
          <Input
            id="setup-date"
            name="setupDate"
            type="date"
            disabled={isPending}
            value={setupDate}
            onChange={(e) => setSetupDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            When items need to be delivered/setup
          </p>
        </div>

        {/* Return Date */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="return-date">Return Date</Label>
          <Input
            id="return-date"
            name="returnDate"
            type="date"
            disabled={isPending}
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            When items should be returned/collected
          </p>
        </div>

        {/* Venue */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="event-venue">Venue</Label>
          <Input
            id="event-venue"
            name="venue"
            disabled={isPending}
            value={venue}
            onChange={(e) => setVenue(filterName(e.target.value))}
            placeholder="e.g. Grand Ballroom, Tahir Guest Palace"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="event-notes">Notes</Label>
        <Textarea
          id="event-notes"
          name="notes"
          disabled={isPending}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Special requests, color scheme, theme details..."
          rows={3}
        />
      </div>

      {/* Error / Success */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p
          className="text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
        >
          Event updated successfully.
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : mode === "edit" ? (
            <SaveIcon />
          ) : (
            <CalendarPlusIcon />
          )}
          {isPending
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Event"}
        </Button>
      </div>
    </form>
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title={mode === "edit" ? "Save Changes" : "Create Event"}
      description={mode === "edit" ? "Save changes to this event?" : "Create this new event?"}
      confirmLabel={mode === "edit" ? "Yes, Save" : "Yes, Create Event"}
      isLoading={isPending}
    />
    </>
  );
}

// --- New Customer Dialog ---

function NewCustomerDialog({
  onCreated,
}: {
  onCreated: (customer: Customer) => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name?.trim()) {
      setError("Customer name is required.");
      return;
    }

    startTransition(async () => {
      try {
        const created = await createCustomer(formData);
        onCreated({
          id: created.id,
          name: created.name,
          phone: created.phone,
        });
        setOpen(false);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create customer."
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
          />
        }
      >
        <UserPlusIcon />
        <span className="sr-only">New Customer</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to associate with this event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-name">Name</Label>
            <Input
              id="new-cust-name"
              name="name"
              required
              disabled={isPending}
              placeholder="Customer name"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-phone">Phone</Label>
            <Input
              id="new-cust-phone"
              name="phone"
              type="tel"
              disabled={isPending}
              placeholder="e.g. 08012345678"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-email">Email (optional)</Label>
            <Input
              id="new-cust-email"
              name="email"
              type="email"
              disabled={isPending}
              placeholder="email@example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2Icon className="animate-spin" />
              ) : (
                <PlusIcon />
              )}
              {isPending ? "Creating..." : "Create Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
