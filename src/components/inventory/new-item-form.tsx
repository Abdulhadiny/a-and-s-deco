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
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { ImageUpload } from "@/components/inventory/image-upload";
import { MoneyInput } from "@/components/ui/money-input";
import { filterName, filterTag } from "@/lib/input-filters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

interface NewItemFormProps {
  categories: Category[];
  locations?: Location[];
}

export function NewItemForm({ categories: initialCategories, locations = [] }: NewItemFormProps) {
  const [categories, setCategories] = useState(initialCategories);
  const [tab, setTab] = useState("single");

  return (
    <Tabs value={tab} onValueChange={(v) => { if (v) setTab(v); }}>
      <TabsList>
        <TabsTrigger value="single">Single Item</TabsTrigger>
        <TabsTrigger value="bulk">Bulk Add</TabsTrigger>
      </TabsList>
      <TabsContent value="single">
        <SingleItemForm
          categories={categories}
          locations={locations}
          onCategoriesChange={setCategories}
        />
      </TabsContent>
      <TabsContent value="bulk">
        <BulkAddForm
          categories={categories}
          locations={locations}
          onCategoriesChange={setCategories}
        />
      </TabsContent>
    </Tabs>
  );
}

// --- Single Item Form ---

function SingleItemForm({
  categories,
  locations,
  onCategoriesChange,
}: {
  categories: Category[];
  locations: Location[];
  onCategoriesChange: (cats: Category[]) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<FormData | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("main-warehouse");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("categoryId", categoryId);
    formData.set("locationId", locationId);
    formData.set("imageUrl", imageUrl ?? "");

    setPendingFormData(formData);
    setShowConfirm(true);
  }

  function handleConfirmedSubmit() {
    if (!pendingFormData) return;
    setShowConfirm(false);
    startTransition(async () => {
      try {
        await createItem(Object.fromEntries(pendingFormData.entries()));
        router.push("/inventory");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create item.",
        );
      } finally {
        setPendingFormData(null);
      }
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      <div className="grid gap-6 lg:grid-cols-[1fr_11rem]">
        {/* Left: all input fields */}
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Category with New Category button */}
            <div className="flex flex-col gap-1.5">
              <Label>Category</Label>
              <div className="flex gap-2">
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

            {/* Location */}
            <div className="flex flex-col gap-1.5">
              <Label>Initial Stock Location</Label>
              <Select value={locationId} onValueChange={(v) => { if (v) setLocationId(v); }} disabled={isPending}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location">
                    {locations.find((l) => l.id === locationId)?.name}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="single-name">Name</Label>
              <Input
                id="single-name"
                name="name"
                value={name}
                onChange={(e) => setName(filterName(e.target.value))}
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
                value={tag}
                onChange={(e) => setTag(filterTag(e.target.value))}
                required
                disabled={isPending}
                placeholder="e.g. CHAN-001"
                className="uppercase"
              />
            </div>

            {/* Rental Price */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="single-price">Rental Price (NGN)</Label>
              <MoneyInput
                id="single-price"
                name="rentalPrice"
                disabled={isPending}
                placeholder="0"
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
        </div>

        {/* Right: image */}
        <div className="flex flex-col gap-1.5">
          <Label>Image</Label>
          <ImageUpload value={imageUrl} onChange={setImageUrl} disabled={isPending} previewClassName="w-full" />
        </div>
      </div>

      <input type="hidden" name="initialQuantity" value="1" />

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
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title="Create Item"
      description="Create this new inventory item?"
      confirmLabel="Yes, Create Item"
      isLoading={isPending}
    />
    </>
  );
}

// --- Bulk Add Form ---

function BulkAddForm({
  categories,
  locations,
  onCategoriesChange,
}: {
  categories: Category[];
  locations: Location[];
  onCategoriesChange: (cats: Category[]) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingItems, setPendingItems] = useState<Array<{ categoryId: string; name: string; tag: string; rentalPrice: number; initialQuantity: number; locationId: string }> | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("main-warehouse");
  const [baseName, setBaseName] = useState("");
  const [tagPrefix, setTagPrefix] = useState("");
  const [startNumber, setStartNumber] = useState(1);
  const [count, setCount] = useState(1);
  const [rentalPrice, setRentalPrice] = useState(0);

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
        rentalPrice,
        initialQuantity: 1,
        locationId,
      };
    });

    setPendingItems(items);
    setShowConfirm(true);
  }

  function handleConfirmedSubmit() {
    if (!pendingItems) return;
    setShowConfirm(false);
    startTransition(async () => {
      try {
        await bulkCreateItems(pendingItems);
        router.push("/inventory");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to create items.",
        );
      } finally {
        setPendingItems(null);
      }
    });
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Category */}
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <div className="flex gap-2">
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

        {/* Location */}
        <div className="flex flex-col gap-1.5">
          <Label>Initial Stock Location</Label>
          <Select value={locationId} onValueChange={(v) => { if (v) setLocationId(v); }} disabled={isPending}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select location">
                {locations.find((l) => l.id === locationId)?.name}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Base Name */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-name">Base Name</Label>
          <Input
            id="bulk-name"
            value={baseName}
            onChange={(e) => setBaseName(filterName(e.target.value))}
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
            onChange={(e) => setTagPrefix(filterTag(e.target.value))}
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
          <p className="text-xs text-muted-foreground">
            Continue from a previous batch (e.g. set to 51 if you already have 1–50)
          </p>
        </div>

        {/* Count */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="bulk-count">Items to Create</Label>
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
          <MoneyInput
            id="bulk-price"
            name="bulk-rental-price"
            onChange={setRentalPrice}
            disabled={isPending}
            placeholder="0"
          />
          <p className="text-xs text-muted-foreground">
            Same price applied to every item in this batch
          </p>
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
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title="Bulk Create Items"
      description={`Create ${count} item${count !== 1 ? "s" : ""}? This cannot be undone.`}
      confirmLabel={`Yes, Create ${count} Item${count !== 1 ? "s" : ""}`}
      isLoading={isPending}
    />
    </>
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
