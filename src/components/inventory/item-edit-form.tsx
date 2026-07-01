"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateItem } from "@/lib/actions/inventory";
import { ItemStatus } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2Icon, SaveIcon } from "lucide-react";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ImageUpload } from "@/components/inventory/image-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyInput } from "@/components/ui/money-input";
import { filterName, filterTag } from "@/lib/input-filters";

interface Category {
  id: string;
  name: string;
}

interface ItemData {
  id: string;
  name: string;
  tag: string;
  categoryId: string;
  rentalPrice: string | number;
  description: string | null;
  imageUrl: string | null;
  status: ItemStatus;
  conditionNotes: string | null;
}

interface ItemEditFormProps {
  item: ItemData;
  categories: Category[];
}

const STATUS_OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "AVAILABLE", label: "Available" },
  { value: "DAMAGED", label: "Damaged" },
  { value: "RETIRED", label: "Retired" },
];

export function ItemEditForm({ item, categories }: ItemEditFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);

  const [name, setName] = useState(item.name);
  const [tag, setTag] = useState(item.tag);
  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [categoryId, setCategoryId] = useState(item.categoryId);
  const [imageUrl, setImageUrl] = useState<string | null>(item.imageUrl ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    // Override select values that are managed by state
    formData.set("status", status);
    formData.set("categoryId", categoryId);
    formData.set("imageUrl", imageUrl ?? "");

    setPendingFormData(formData);
    setShowConfirm(true);
  }

  function handleConfirmedSubmit() {
    if (!pendingFormData) return;
    setShowConfirm(false);
    startTransition(async () => {
      try {
        await updateItem(item.id, pendingFormData);
        setSuccess(true);
        router.refresh();
        // Clear success after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update item.",
        );
      } finally {
        setPendingFormData(null);
      }
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_11rem]">
        {/* Left: all input fields */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={name}
                onChange={(e) => setName(filterName(e.target.value))}
                required
                disabled={isPending}
              />
            </div>

            {/* Tag */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-tag">Tag</Label>
              <Input
                id="edit-tag"
                name="tag"
                value={tag}
                onChange={(e) => setTag(filterTag(e.target.value))}
                required
                disabled={isPending}
                className="uppercase"
              />
            </div>

            {/* Category */}
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={(v) => { if (v) setCategoryId(v); }} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category">
                    {categories.find((c) => c.id === categoryId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Rental Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="edit-price">Rental Price (NGN)</Label>
              <MoneyInput
                id="edit-price"
                name="rentalPrice"
                defaultValue={Number(item.rentalPrice)}
                disabled={isPending}
              />
            </div>

            {/* Status */}
            <div className="flex flex-col gap-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={(v) => { if (v) setStatus(v as ItemStatus); }} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status">
                    {STATUS_OPTIONS.find((o) => o.value === status)?.label}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={item.description ?? ""}
              disabled={isPending}
              placeholder="Optional description..."
              rows={3}
            />
          </div>

          {/* Condition Notes */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-condition">Condition Notes</Label>
            <Textarea
              id="edit-condition"
              name="conditionNotes"
              defaultValue={item.conditionNotes ?? ""}
              disabled={isPending}
              placeholder="Note any damage, wear, or special conditions..."
              rows={3}
            />
          </div>
        </div>

        {/* Right: image */}
        <div className="flex flex-col gap-1.5">
          <Label>Image</Label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} disabled={isPending} previewClassName="w-full" />
        </div>
      </div>

      {/* Error / Success feedback */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400" role="status">
          Item updated successfully.
        </p>
      )}

      {/* Submit */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title="Save Changes"
      description="Save changes to this inventory item?"
      confirmLabel="Yes, Save Changes"
      isLoading={isPending}
    />
    </>
  );
}
