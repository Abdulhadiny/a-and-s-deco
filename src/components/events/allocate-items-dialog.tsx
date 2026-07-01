"use client";

import { useState, useTransition, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { allocateItems, getAvailableItemsAction } from "@/lib/actions/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Loader2Icon,
  PlusIcon,
  CheckIcon,
  PackagePlusIcon,
  SearchIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AvailableItem {
  id: string;
  name: string;
  tag: string;
  rentalPrice: string | number;
  category: { id: string; name: string } | null;
}

interface AllocateItemsDialogProps {
  eventId: string;
  eventDate: string;
  availableItems: AvailableItem[];
  locations: { id: string; name: string }[];
  /** IDs already allocated to this event, to skip in the list */
  alreadyAllocatedIds?: string[];
}

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export function AllocateItemsDialog({
  eventId,
  eventDate,
  availableItems: initialItems,
  locations,
  alreadyAllocatedIds = [],
}: AllocateItemsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isLoadingItems, setIsLoadingItems] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [availableItems, setAvailableItems] = useState(initialItems);
  const [locationId, setLocationId] = useState("main-warehouse");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("__all__");

  async function handleLocationChange(newLocationId: string | null) {
    if (!newLocationId) return;
    setLocationId(newLocationId);
    setSelectedIds(new Set());
    setIsLoadingItems(true);
    try {
      const items = await getAvailableItemsAction(eventDate, eventId, newLocationId);
      setAvailableItems(items);
    } catch {
      setError("Failed to load items for this location.");
    } finally {
      setIsLoadingItems(false);
    }
  }

  // Exclude items already allocated to this event
  const allocatedSet = useMemo(
    () => new Set(alreadyAllocatedIds),
    [alreadyAllocatedIds]
  );

  // Build category list from available items
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const item of availableItems) {
      if (item.category) {
        map.set(item.category.id, item.category.name);
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [availableItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return availableItems.filter((item) => {
      if (allocatedSet.has(item.id)) return false;
      if (
        categoryFilter !== "__all__" &&
        item.category?.id !== categoryFilter
      ) {
        return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const matchName = item.name.toLowerCase().includes(q);
        const matchTag = item.tag.toLowerCase().includes(q);
        if (!matchName && !matchTag) return false;
      }
      return true;
    });
  }, [availableItems, allocatedSet, categoryFilter, search]);

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredItems.map((i) => i.id)));
  }, [filteredItems]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  async function handleAllocate() {
    if (selectedIds.size === 0) return;
    setError(null);

    startTransition(async () => {
      try {
        await allocateItems(eventId, Array.from(selectedIds), locationId);
        setSelectedIds(new Set());
        setSearch("");
        setCategoryFilter("__all__");
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to allocate items."
        );
      }
    });
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setSelectedIds(new Set());
      setSearch("");
      setCategoryFilter("__all__");
      setLocationId("main-warehouse");
      setAvailableItems(initialItems);
      setError(null);
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={<Button variant="outline" />}
      >
        <PackagePlusIcon />
        Allocate Items
      </SheetTrigger>
      <SheetContent side="right" className="flex flex-col sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Allocate Items</SheetTitle>
          <SheetDescription>
            Select items to assign to this event. Only available items for the
            event date range are shown.
          </SheetDescription>
        </SheetHeader>

        {/* Filters */}
        <div className="flex flex-col gap-3 border-b px-4 pb-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Warehouse / Location</Label>
            <Select value={locationId} onValueChange={handleLocationChange} disabled={isPending || isLoadingItems}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select warehouse">
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
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or tag..."
              className="pl-8"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Filter by category</Label>
            <Select value={categoryFilter} onValueChange={(v) => { if (v) setCategoryFilter(v); }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories">
                  {categoryFilter === "__all__" ? "All Categories" : categories.find((c) => c.id === categoryFilter)?.name}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}{" "}
              available
              {selectedIds.size > 0 && (
                <span className="font-medium text-foreground">
                  {" "}
                  / {selectedIds.size} selected
                </span>
              )}
            </p>
            <div className="flex gap-1">
              <Button variant="ghost" size="xs" onClick={selectAll}>
                Select All
              </Button>
              {selectedIds.size > 0 && (
                <Button variant="ghost" size="xs" onClick={clearSelection}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Item list */}
        <div className="flex-1 overflow-y-auto px-4">
          {isLoadingItems ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                Loading items...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No available items match your filters.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1 py-2">
              {filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleItem(item.id)}
                    className={[
                      "flex items-center gap-3 rounded-lg border p-2.5 text-left transition-colors",
                      isSelected
                        ? "border-primary bg-primary/5"
                        : "border-transparent hover:bg-muted",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-5 shrink-0 items-center justify-center rounded border",
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30",
                      ].join(" ")}
                    >
                      {isSelected && <CheckIcon className="size-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.tag}
                        {item.category
                          ? ` \u00B7 ${item.category.name}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium">
                      {formatNGN.format(Number(item.rentalPrice))}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="px-4">
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Footer */}
        <SheetFooter>
          <Button
            onClick={handleAllocate}
            disabled={isPending || selectedIds.size === 0}
            className="w-full"
          >
            {isPending ? (
              <Loader2Icon className="animate-spin" />
            ) : (
              <PlusIcon />
            )}
            {isPending
              ? "Allocating..."
              : `Allocate ${selectedIds.size} Item${selectedIds.size !== 1 ? "s" : ""}`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
