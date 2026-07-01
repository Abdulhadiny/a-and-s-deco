"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
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
  UserPlusIcon,
} from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { filterName } from "@/lib/input-filters";

interface CustomerData {
  id: string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

interface CustomerFormProps {
  customer?: CustomerData;
  mode?: "create" | "edit";
}

/**
 * Inline customer form used on the customer detail page for editing,
 * and embedded inside CustomerFormDialog for creation.
 */
export function CustomerForm({
  customer,
  mode = "create",
}: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [customerName, setCustomerName] = useState(customer?.name ?? "");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    if (!name?.trim()) {
      setError("Customer name is required.");
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
        if (mode === "edit" && customer) {
          await updateCustomer(customer.id, pendingFormData);
          setSuccess(true);
          router.refresh();
          setTimeout(() => setSuccess(false), 3000);
        } else {
          const created = await createCustomer(pendingFormData);
          router.push(`/customers/${created.id}`);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save customer."
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
        {/* Name */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="cust-name">Name</Label>
          <Input
            id="cust-name"
            name="name"
            value={customerName}
            onChange={(e) => setCustomerName(filterName(e.target.value))}
            required
            disabled={isPending}
            placeholder="Customer name"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cust-phone">Phone</Label>
          <Input
            id="cust-phone"
            name="phone"
            type="tel"
            disabled={isPending}
            defaultValue={customer?.phone ?? ""}
            placeholder="e.g. 08012345678"
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cust-email">Email</Label>
          <Input
            id="cust-email"
            name="email"
            type="email"
            disabled={isPending}
            defaultValue={customer?.email ?? ""}
            placeholder="email@example.com"
          />
        </div>

        {/* Address */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor="cust-address">Address</Label>
          <Input
            id="cust-address"
            name="address"
            disabled={isPending}
            defaultValue={customer?.address ?? ""}
            placeholder="Street address, city"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cust-notes">Notes</Label>
        <Textarea
          id="cust-notes"
          name="notes"
          disabled={isPending}
          defaultValue={customer?.notes ?? ""}
          placeholder="Additional notes about this customer..."
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
          Customer updated successfully.
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
            <UserPlusIcon />
          )}
          {isPending
            ? "Saving..."
            : mode === "edit"
              ? "Save Changes"
              : "Create Customer"}
        </Button>
      </div>
    </form>
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title={mode === "edit" ? "Save Changes" : "Create Customer"}
      description={mode === "edit" ? "Save changes to this customer's details?" : "Create this new customer?"}
      confirmLabel={mode === "edit" ? "Yes, Save" : "Yes, Create"}
      isLoading={isPending}
    />
    </>
  );
}

/**
 * Dialog wrapper for creating a new customer.
 * Used on the customers list page header and empty state.
 */
export function CustomerFormDialog() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [dialogName, setDialogName] = useState("");

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
        setOpen(false);
        setError(null);
        router.push(`/customers/${created.id}`);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create customer."
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <PlusIcon />
        Add Customer
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Customer</DialogTitle>
          <DialogDescription>
            Add a new customer to your contacts.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-name">Name</Label>
            <Input
              id="new-cust-name"
              name="name"
              value={dialogName}
              onChange={(e) => setDialogName(filterName(e.target.value))}
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-address">Address (optional)</Label>
            <Input
              id="new-cust-address"
              name="address"
              disabled={isPending}
              placeholder="Street address, city"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-cust-notes">Notes (optional)</Label>
            <Textarea
              id="new-cust-notes"
              name="notes"
              disabled={isPending}
              placeholder="Additional notes..."
              rows={2}
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
