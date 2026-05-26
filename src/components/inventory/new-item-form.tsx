"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  createItem,
  createCategory,
  bulkCreateItems,
} from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Loader2Icon, PlusIcon, PackagePlusIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
}

interface NewItemFormProps {
  categories: Category[];
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function NewItemForm({ categories: initialCategories }: NewItemFormProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [tab, setTab] = useState("single");

  return (
    <Tabs value={tab} onValueChange={setTab}>
      <TabsList>
        <TabsTrigger value="single">Single Item</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
      </TabsList>
      <TabsContent value="single">
        <SingleItemForm
          categories={categories}
          onCategoriesChange={setCategories}
        />
      </TabsContent>
      <TabsContent value="bulk">
        <BulkAddForm
          categories={categories}
          onCategoriesChange={setCategories}
        />
      </TabsContent>
    </Tabs>
  );
}

// --- Single Item Form ---

function SingleItemForm({
  categories,
  onCategoriesChange,
}: {
  categories: Category[];
  onCategoriesChange: (cats: Category[]) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("categoryId", categoryId);

    startTransition(async () => {
      try {
        await createItem(formData);
        router.push("/inventory");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create item.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category with New Category button */}
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <div className="flex gap-2">
            <select
              className={selectClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={isPending}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <NewCategoryDialog
              onCreated={(cat) => {
                onCategoriesChange([...categories, cat].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ));
                setCategoryId(cat.id);
              }}
            />
          </div>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="single-name">Name</Label>
          <Input
            id="single-name"
            name="name"
            required
            disabled={isPending}
            placeholder="e.g. Gold Chiavari Chair"
          />
        </div>

        {/* Tag */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="single-tag">Tag</Label>
          <Input
            id="single-tag"
            name="tag"
            required
            disabled={isPending}
            placeholder="e.g. CHAN-001"
            className="uppercase"
          />
        </div>

        {/* Rental Price */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="single-price">Rental Price (NGN)</Label>
          <Input
            id="single-price"
            name="rentalPrice"
            type="number"
            min="0"
            step="0.01"
            required
            disabled={isPending}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="single-desc">Description</Label>
        <Textarea
          id="single-desc"
          name="description"
          disabled={isPending}
          placeholder="Optional description..."
          rows={3}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !categoryId}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PlusIcon />
          )}
          {isPending ? "Creating..." : "Create Item"}
        </Button>
      </div>
    </form>
  );
}

// --- Bulk Add Form ---

function BulkAddForm({
  categories,
  onCategoriesChange,
}: {
  categories: Category[];
  onCategoriesChange: (cats: Category[]) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [baseName, setBaseName] = useState("");
  const [tagPrefix, setTagPrefix] = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(1);
  const [rentalPrice, setRentalPrice] = useState("");

  // Preview the tags that will be generated
  const previewTags = Array.from({ length: Math.min(count, 10) }, (_, i) => {
    const num = startNumber + i;
    return `${tagPrefix.toUpperCase()}-${String(num).padStart(3, "0")}`;
  });

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!baseName.trim() || !tagPrefix.trim() || !rentalPrice) {
      setError("Please fill in all required fields.");
      return;
    }
    if (count < 1 || count > 200) {
      setError("Count must be between 1 and 200.");
      return;
    }

    const items = Array.from({ length: count }, (_, i) => {
      const num = startNumber + i;
      return {
        categoryId,
        name: `${baseName.trim()} ${num}`,
        tag: `${tagPrefix.trim().toUpperCase()}-${String(num).padStart(3, "0")}`,
        rentalPrice: parseFloat(rentalPrice),
      };
    });

    startTransition(async () => {
      try {
        await bulkCreateItems(items);
        router.push("/inventory");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create items.",
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <div className="flex gap-2">
            <select
              className={selectClass}
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
              disabled={isPending}
            >
              <option value="" disabled>
                Select category
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <NewCategoryDialog
              onCreated={(cat) => {
                onCategoriesChange([...categories, cat].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ));
                setCategoryId(cat.id);
              }}
            />
          </div>
        </div>

        {/* Base Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-name">Base Name</Label>
          <Input
            id="bulk-name"
            value={baseName}
            onChange={(e) => setBaseName(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. Gold Chiavari Chair"
          />
          <p className="text-xs text-muted-foreground">
            Items will be named &quot;{baseName || "Name"} 1&quot;, &quot;
            {baseName || "Name"} 2&quot;, etc.
          </p>
        </div>

        {/* Tag Prefix */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-prefix">Tag Prefix</Label>
          <Input
            id="bulk-prefix"
            value={tagPrefix}
            onChange={(e) => setTagPrefix(e.target.value)}
            required
            disabled={isPending}
            placeholder="e.g. CHAN"
            className="uppercase"
          />
        </div>

        {/* Starting Number */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-start">Starting Number</Label>
          <Input
            id="bulk-start"
            type="number"
            min="1"
            value={startNumber}
            onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)}
            required
            disabled={isPending}
          />
        </div>

        {/* Count */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-count">Count</Label>
          <Input
            id="bulk-count"
            type="number"
            min="1"
            max="200"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            required
            disabled={isPending}
          />
        </div>

        {/* Rental Price */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-price">Rental Price (NGN)</Label>
          <Input
            id="bulk-price"
            type="number"
            min="0"
            step="0.01"
            value={rentalPrice}
            onChange={(e) => setRentalPrice(e.target.value)}
            required
            disabled={isPending}
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Tag preview */}
      {tagPrefix && count > 0 && (
        <div className="flex flex-col gap-2">
          <Separator />
          <p className="text-xs font-medium text-muted-foreground">
            Tag Preview ({count} item{count !== 1 ? "s" : ""})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {previewTags.map((tag) => (
              <span
                key={tag}
                className="inline-flex rounded-md bg-muted px-2 py-0.5 text-xs font-mono"
              >
                {tag}
              </span>
            ))}
            {count > 10 && (
              <span className="inline-flex items-center px-2 py-0.5 text-xs text-muted-foreground">
                +{count - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !categoryId}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <PackagePlusIcon />
          )}
          {isPending ? "Creating..." : `Create ${count} Item${count !== 1 ? "s" : ""}`}
        </Button>
      </div>
    </form>
  );
}

// --- New Category Dialog ---

function NewCategoryDialog({
  onCreated,
}: {
  onCreated: (category: Category) => void;
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
      setError("Category name is required.");
      return;
    }

    startTransition(async () => {
      try {
        await createCategory(formData);
        const { getCategories } = await import("@/lib/actions/inventory");
        const updated = await getCategories();
        const created = updated.find(
          (c: { name: string }) => c.name.toLowerCase() === name.trim().toLowerCase(),
        );
        if (created) {
          onCreated({ id: created.id, name: created.name });
        }
        setOpen(false);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create category.",
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button type="button" variant="outline" size="icon" className="shrink-0" />
        }
      >
        <PlusIcon />
        <span className="sr-only">New Category</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Category</DialogTitle>
          <DialogDescription>
            Create a new item category for organizing your inventory.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-name">Category Name</Label>
            <Input
              id="cat-name"
              name="name"
              required
              disabled={isPending}
              placeholder="e.g. Chairs, Flowers, Lighting"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cat-desc">Description (optional)</Label>
            <Input
              id="cat-desc"
              name="description"
              disabled={isPending}
              placeholder="Brief description..."
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
              {isPending ? "Creating..." : "Create Category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
