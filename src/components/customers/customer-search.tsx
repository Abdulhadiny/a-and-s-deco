"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback, useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchIcon, XIcon } from "lucide-react";

interface CustomerSearchProps {
  currentSearch?: string;
}

export function CustomerSearch({ currentSearch }: CustomerSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateSearch = useCallback(
    (value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("search", value);
      } else {
        params.delete("search");
      }
      const queryString = params.toString();
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname);
      });
    },
    [router, pathname, searchParams],
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex-1">
        <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search customers by name or phone..."
          defaultValue={currentSearch ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (searchTimeoutRef.current) {
              clearTimeout(searchTimeoutRef.current);
            }
            searchTimeoutRef.current = setTimeout(() => {
              updateSearch(value || null);
            }, 300);
          }}
          className="pl-8"
          aria-label="Search customers"
        />
      </div>
      {currentSearch && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => updateSearch(null)}
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
