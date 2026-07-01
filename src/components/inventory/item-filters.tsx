"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ItemFiltersProps {
  categories: Category[];
  currentSearch?: string;
  currentCategory?: string;
  currentStatus?: string;
}

export function ItemFilters({
  categories,
  currentSearch,
  currentCategory,
  currentStatus,
}: ItemFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateParams = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      const queryString = params.toString();
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      });
    },
    [router, pathname, searchParams],
  );

  const clearFilters = useCallback(() => {
    startTransition(() => {
      router.push(pathname);
    });
  }, [router, pathname]);

  const hasFilters = currentSearch || currentCategory || currentStatus;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* Search input */}
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search items by name or tag..."
          defaultValue={currentSearch ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
              updateParams("search", value || null);
            }, 300);
          }}
          className="pl-8"
          aria-label="Search inventory items"
        />
      </div>

      {/* Category filter */}
      <Select
        value={currentCategory || "__all__"}
        onValueChange={(v) => updateParams("category", v === "__all__" ? null : v)}
      >
        <SelectTrigger className="sm:w-44">
          <SelectValue>
            {currentCategory ? categories.find((c) => c.id === currentCategory)?.name : "All Categories"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Categories</SelectItem>
          {categories.map((c) => (
            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={currentStatus || "__all__"}
        onValueChange={(v) => updateParams("status", v === "__all__" ? null : v)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue>
            {currentStatus
              ? ({ AVAILABLE: "Available", DAMAGED: "Damaged", RETIRED: "Retired" } as Record<string, string>)[currentStatus]
              : "All Statuses"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All Statuses</SelectItem>
          <SelectItem value="AVAILABLE">Available</SelectItem>
          <SelectItem value="DAMAGED">Damaged</SelectItem>
          <SelectItem value="RETIRED">Retired</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          disabled={isPending}
          className="shrink-0"
        >
          <XIcon className="size-3.5" />
          Clear
        </Button>
      )}
    </div>
  );
}
