"use client";

import { useState } from "react";
import Link from "next/link";
import { reconcileDamages } from "@/lib/actions/events";
import { formatCurrency } from "@/lib/utils/currency";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { AlertTriangleIcon, ExternalLinkIcon, ReceiptIcon } from "lucide-react";

interface DamageItem {
  id: string;
  item: { name: string; tag: string };
  returnCondition: string;
  damageNotes: string | null;
}

interface DamageQuote {
  id: string;
  total: number;
  status: string;
  paymentStatus: string;
}

interface Props {
  eventId: string;
  eventStatus: string;
  damageItems: DamageItem[];
  damageQuote?: DamageQuote;
}

function conditionBadge(condition: string) {
  if (condition === "DAMAGED") {
    return (
      <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400">
        Damaged
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">
      Missing
    </Badge>
  );
}

function paymentStatusBadge(status: string) {
  switch (status) {
    case "reconciled":
      return <Badge variant="default">Paid</Badge>;
    case "partial":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          Partial
        </Badge>
      );
    default:
      return <Badge variant="outline">Outstanding</Badge>;
  }
}

export function DamageReconciliation({
  eventId,
  eventStatus,
  damageItems,
  damageQuote,
}: Props) {
  const [open, setOpen] = useState(false);
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  if (damageItems.length === 0) return null;

  // State A — already reconciled
  if (damageQuote) {
    return (
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <ReceiptIcon className="size-4" />
            Damage Invoice
          </CardTitle>
          <CardDescription>
            Damage charges have been invoiced
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-lg font-semibold">
                {formatCurrency(damageQuote.total)}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{damageQuote.status}</Badge>
                {paymentStatusBadge(damageQuote.paymentStatus)}
              </div>
            </div>
            <Button variant="outline" size="sm" render={<Link href={`/quotes/${damageQuote.id}`} />}>
                View Invoice
                <ExternalLinkIcon className="ml-1 size-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // State B — needs reconciliation (only for completed events)
  if (eventStatus !== "COMPLETED") return null;

  const allAmountsFilled = damageItems.every(
    (di) => amounts[di.id] && Number(amounts[di.id]) > 0
  );

  async function handleSubmit() {
    setLoading(true);
    try {
      await reconcileDamages({
        eventId,
        items: damageItems.map((di) => ({
          eventItemId: di.id,
          itemName: di.item.name,
          condition: di.returnCondition as "DAMAGED" | "MISSING",
          amount: Number(amounts[di.id]),
          notes: di.damageNotes ?? undefined,
        })),
      });
      toast.success("Damage invoice created");
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reconcile damages");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="border-amber-200 dark:border-amber-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <AlertTriangleIcon className="size-4" />
            Damage Reconciliation Needed
          </CardTitle>
          <CardDescription>
            {damageItems.length} item{damageItems.length !== 1 ? "s were" : " was"} returned
            damaged or missing
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <ul className="flex flex-col gap-1.5 text-sm">
            {damageItems.map((di) => (
              <li key={di.id} className="flex items-center justify-between">
                <span className="font-medium">{di.item.name}</span>
                {conditionBadge(di.returnCondition)}
              </li>
            ))}
          </ul>
          <Button
            variant="outline"
            className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
            onClick={() => setOpen(true)}
          >
            Reconcile Damages
          </Button>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reconcile Damages</DialogTitle>
            <DialogDescription>
              Enter the negotiated charge per damaged or missing item. This creates a damage
              invoice and records write-off expenses.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            {damageItems.map((di) => (
              <div
                key={di.id}
                className="rounded-lg border p-3 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-sm">{di.item.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      {di.item.tag}
                    </span>
                  </div>
                  {conditionBadge(di.returnCondition)}
                </div>
                {di.damageNotes && (
                  <p className="text-xs text-muted-foreground">{di.damageNotes}</p>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground shrink-0">
                    Charge (₦)
                  </span>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={amounts[di.id] ?? ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({ ...prev, [di.id]: e.target.value }))
                    }
                    className={cn(
                      "h-8 text-sm",
                      amounts[di.id] && Number(amounts[di.id]) <= 0 &&
                        "border-red-500"
                    )}
                  />
                </div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!allAmountsFilled || loading}
            >
              {loading ? "Creating..." : "Confirm Reconciliation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
