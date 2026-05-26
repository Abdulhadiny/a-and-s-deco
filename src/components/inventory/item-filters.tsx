"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

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

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 sm:w-44";

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
      <select
        className={selectClass}
        value={currentCategory ?? ""}
        onChange={(e) => updateParams("category", e.target.value || null)}
        aria-label="Filter by category"
      >
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {/* Status filter */}
      <select
        className={`${selectClass} sm:w-40`}
        value={currentStatus ?? ""}
        onChange={(e) => updateParams("status", e.target.value || null)}
        aria-label="Filter by status"
      >
        <option value="">All Statuses</option>
        <option value="AVAILABLE">Available</option>
        <option value="DAMAGED">Damaged</option>
        <option value="RETIRED">Retired</option>
      </select>

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
