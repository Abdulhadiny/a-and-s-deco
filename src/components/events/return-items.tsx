"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { returnItem, returnAllItems } from "@/lib/actions/events";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2Icon,
  CheckCircleIcon,
  AlertTriangleIcon,
  CircleHelpIcon,
  CheckCheckIcon,
} from "lucide-react";

interface EventItemEntry {
  id: string;
  itemId: string;
  returnedAt: string | Date | null;
  returnCondition: string | null;
  damageNotes: string | null;
  item: {
    id: string;
    name: string;
    tag: string;
    category: { id: string; name: string } | null;
  };
}

interface ReturnItemsProps {
  eventId: string;
  eventItems: EventItemEntry[];
  locations: { id: string; name: string }[];
}

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

type ReturnCondition = "GOOD" | "DAMAGED" | "MISSING";

export function ReturnItems({ eventId, eventItems, locations }: ReturnItemsProps) {
  const [locationId, setLocationId] = useState("main-warehouse");
  const unreturned = eventItems.filter((ei) => !ei.returnedAt);
  const returned = eventItems.filter((ei) => ei.returnedAt);

  if (eventItems.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No items allocated to this event.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Location picker for returns */}
      {unreturned.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <Label className="text-xs">Return to Warehouse</Label>
          <select
            className={selectClass}
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            aria-label="Return location"
          >
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Unreturned items */}
      {unreturned.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Pending Return ({unreturned.length})
            </p>
            <ReturnAllButton eventId={eventId} locationId={locationId} count={unreturned.length} />
          </div>
          <div className="flex flex-col gap-2">
            {unreturned.map((ei) => (
              <ReturnItemRow key={ei.id} eventItem={ei} locationId={locationId} />
            ))}
          </div>
        </div>
      )}

      {/* Returned items */}
      {returned.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-muted-foreground">
            Returned ({returned.length})
          </p>
          <div className="flex flex-col gap-2">
            {returned.map((ei) => (
              <div
                key={ei.id}
                className="flex items-center justify-between rounded-lg border border-muted bg-muted/30 p-3"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium">{ei.item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ei.item.tag}
                    {ei.item.category
                      ? ` \u00B7 ${ei.item.category.name}`
                      : ""}
                  </span>
                </div>
                <ConditionBadge condition={ei.returnCondition} />
              </div>
            ))}
          </div>
        </div>
      )}

      {unreturned.length === 0 && returned.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <CheckCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
          <p className="text-sm text-emerald-700 dark:text-emerald-300">
            All items have been returned.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Individual return row ---

function ReturnItemRow({ eventItem, locationId }: { eventItem: EventItemEntry; locationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDamageInput, setShowDamageInput] = useState(false);
  const [damageNotes, setDamageNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleReturn(condition: ReturnCondition) {
    if (condition === "DAMAGED" && !showDamageInput) {
      setShowDamageInput(true);
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await returnItem(
          eventItem.id,
          condition,
          locationId,
          condition === "DAMAGED" ? damageNotes : undefined
        );
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to return item."
        );
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium">{eventItem.item.name}</span>
          <span className="text-xs text-muted-foreground">
            {eventItem.item.tag}
            {eventItem.item.category
              ? ` \u00B7 ${eventItem.item.category.name}`
              : ""}
          </span>
        </div>
      </div>

      {/* Damage notes input */}
      {showDamageInput && (
        <div className="flex flex-col gap-1.5">
          <Input
            value={damageNotes}
            onChange={(e) => setDamageNotes(e.target.value)}
            placeholder="Describe the damage..."
            disabled={isPending}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5">
        <Button
          variant="outline"
          size="xs"
          disabled={isPending}
          onClick={() => handleReturn("GOOD")}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <CheckCircleIcon />
          )}
          Good
        </Button>
        <Button
          variant="destructive"
          size="xs"
          disabled={isPending}
          onClick={() => handleReturn("DAMAGED")}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <AlertTriangleIcon />
          )}
          {showDamageInput ? "Confirm Damaged" : "Damaged"}
        </Button>
        <Button
          variant="secondary"
          size="xs"
          disabled={isPending}
          onClick={() => handleReturn("MISSING")}
        >
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <CircleHelpIcon />
          )}
          Missing
        </Button>
      </div>
    </div>
  );
}

// --- Return all button ---

function ReturnAllButton({
  eventId,
  locationId,
  count,
}: {
  eventId: string;
  locationId: string;
  count: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleReturnAll() {
    startTransition(async () => {
      await returnAllItems(eventId, locationId);
      router.refresh();
    });
  }

  return (
    <Button
      variant="outline"
      size="xs"
      disabled={isPending}
      onClick={handleReturnAll}
    >
      {isPending ? (
        <Loader2Icon className="animate-spin" />
      ) : (
        <CheckCheckIcon />
      )}
      {isPending ? "Returning..." : `Return All (${count})`}
    </Button>
  );
}

// --- Condition badge ---

function ConditionBadge({ condition }: { condition: string | null }) {
  if (!condition) return null;

  switch (condition) {
    case "GOOD":
      return <Badge variant="default">Good</Badge>;
    case "DAMAGED":
      return <Badge variant="destructive">Damaged</Badge>;
    case "MISSING":
      return <Badge variant="secondary">Missing</Badge>;
    default:
      return <Badge variant="outline">{condition}</Badge>;
  }
}
