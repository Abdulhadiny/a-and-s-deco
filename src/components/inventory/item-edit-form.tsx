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

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

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

  const [status, setStatus] = useState<ItemStatus>(item.status);
  const [categoryId, setCategoryId] = useState(item.categoryId);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    // Override select values that are managed by state
    formData.set("status", status);
    formData.set("categoryId", categoryId);

    startTransition(async () => {
      try {
        await updateItem(item.id, formData);
        setSuccess(true);
        router.refresh();
        // Clear success after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to update item.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Name</Label>
          <Input
            id="edit-name"
            name="name"
            defaultValue={item.name}
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
            defaultValue={item.tag}
            required
            disabled={isPending}
            className="uppercase"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <select
            className={selectClass}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={isPending}
            aria-label="Category"
          >
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Rental Price */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-price">Rental Price (NGN)</Label>
          <Input
            id="edit-price"
            name="rentalPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={Number(item.rentalPrice)}
            required
            disabled={isPending}
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <Label>Status</Label>
          <select
            className={selectClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as ItemStatus)}
            disabled={isPending}
            aria-label="Status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Image URL */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-image">Image URL</Label>
          <Input
            id="edit-image"
            name="imageUrl"
            type="url"
            defaultValue={item.imageUrl ?? ""}
            disabled={isPending}
            placeholder="https://..."
          />
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
  );
}
