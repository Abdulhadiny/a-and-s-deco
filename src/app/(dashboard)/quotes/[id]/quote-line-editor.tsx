"use client";

import { useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  updateQuoteLines,
  updateQuoteDiscount,
  updateQuoteNotes,
} from "@/lib/actions/quotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
  TableFooter,
} from "@/components/ui/table";
import {
  Loader2Icon,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  LockIcon,
} from "lucide-react";

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

interface Line {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface QuoteLineEditorProps {
  quoteId: string;
  initialLines: Line[];
  initialDiscount: number;
  initialNotes: string;
  locked?: boolean;
}

export function QuoteLineEditor({
  quoteId,
  initialLines,
  initialDiscount,
  initialNotes,
  locked = false,
}: QuoteLineEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lines, setLines] = useState<Line[]>(initialLines);
  const [discount, setDiscount] = useState(initialDiscount);
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  const total = Math.max(0, subtotal - discount);

  const updateLine = useCallback(
    (index: number, field: keyof Line, value: string | number) => {
      setLines((prev) => {
        const updated = [...prev];
        const line = { ...updated[index] };

        if (field === "description") {
          line.description = value as string;
        } else if (field === "quantity") {
          const qty = Math.max(1, Number(value) || 1);
          line.quantity = qty;
          line.lineTotal = qty * line.unitPrice;
        } else if (field === "unitPrice") {
          const price = Math.max(0, Number(value) || 0);
          line.unitPrice = price;
          line.lineTotal = line.quantity * price;
        }

        updated[index] = line;
        return updated;
      });
    },
    [],
  );

  function addLine() {
    setLines((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, lineTotal: 0 },
    ]);
  }

  function removeLine(index: number) {
    setLines((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    setError(null);
    setSuccess(false);

    // Validate: at least one line with a description
    const validLines = lines.filter((l) => l.description.trim());
    if (validLines.length === 0) {
      setError("At least one line item with a description is required.");
      return;
    }

    startTransition(async () => {
      try {
        await updateQuoteLines(
          quoteId,
          validLines.map((l) => ({
            id: l.id,
            description: l.description.trim(),
            quantity: l.quantity,
            unitPrice: l.unitPrice,
          })),
        );
        await updateQuoteDiscount(quoteId, discount);
        await updateQuoteNotes(quoteId, notes);
        setSuccess(true);
        router.refresh();
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save quote."
        );
      }
    });
  }

  if (locked) {
    return (
      <div className="flex flex-col gap-5">
        {/* Locked notice */}
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
          <LockIcon className="size-3.5 shrink-0" />
          <span>
            This quote is locked. Use <strong>Revert to Draft</strong> above to make changes.
          </span>
        </div>

        {/* Read-only line items */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[200px]">Description</TableHead>
                <TableHead className="w-20">Qty</TableHead>
                <TableHead className="w-28">Unit Price</TableHead>
                <TableHead className="w-28 text-right">Line Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No line items.
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((line, index) => (
                  <TableRow key={line.id ?? `new-${index}`}>
                    <TableCell className="font-medium">{line.description}</TableCell>
                    <TableCell>{line.quantity}</TableCell>
                    <TableCell>{formatNGN.format(line.unitPrice)}</TableCell>
                    <TableCell className="text-right font-medium">{formatNGN.format(line.lineTotal)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3} className="text-right font-medium">
                  Subtotal
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatNGN.format(subtotal)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>

        <Separator />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {discount > 0 && (
            <div className="flex flex-col gap-1">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Discount</p>
              <p className="text-sm font-medium text-destructive">-{formatNGN.format(discount)}</p>
            </div>
          )}
          <div className="text-right sm:ml-auto">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{formatNGN.format(total)}</p>
          </div>
        </div>

        {notes && (
          <>
            <Separator />
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground">{notes}</p>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Line items table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[200px]">Description</TableHead>
              <TableHead className="w-20">Qty</TableHead>
              <TableHead className="w-28">Unit Price</TableHead>
              <TableHead className="w-28 text-right">Line Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  No line items. Add one below.
                </TableCell>
              </TableRow>
            ) : (
              lines.map((line, index) => (
                <TableRow key={line.id ?? `new-${index}`}>
                  <TableCell>
                    <Input
                      value={line.description}
                      onChange={(e) =>
                        updateLine(index, "description", e.target.value)
                      }
                      placeholder="Item description"
                      disabled={isPending}
                      className="min-w-[180px]"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={1}
                      value={line.quantity}
                      onChange={(e) =>
                        updateLine(index, "quantity", e.target.value)
                      }
                      disabled={isPending}
                      className="w-16"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) =>
                        updateLine(index, "unitPrice", e.target.value)
                      }
                      disabled={isPending}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNGN.format(line.lineTotal)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => removeLine(index)}
                      disabled={isPending}
                    >
                      <TrashIcon className="size-3.5 text-destructive" />
                      <span className="sr-only">Remove line</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="text-right font-medium">
                Subtotal
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatNGN.format(subtotal)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </div>

      {/* Add line button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={addLine}
        disabled={isPending}
        className="self-start"
      >
        <PlusIcon />
        Add Line
      </Button>

      <Separator />

      {/* Discount and total */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1.5 sm:w-48">
          <Label htmlFor="quote-discount">Discount (NGN)</Label>
          <Input
            id="quote-discount"
            type="number"
            min={0}
            step="0.01"
            value={discount}
            onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
            disabled={isPending}
          />
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{formatNGN.format(total)}</p>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="quote-notes">Notes</Label>
        <Textarea
          id="quote-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isPending}
          placeholder="Additional notes, terms, or conditions..."
          rows={3}
        />
      </div>

      {/* Error / Success */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p
          className="text-sm text-emerald-600 dark:text-emerald-400"
          role="status"
        >
          Quote saved successfully.
        </p>
      )}

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (
            <Loader2Icon className="animate-spin" />
          ) : (
            <SaveIcon />
          )}
          {isPending ? "Saving..." : "Save Quote"}
        </Button>
      </div>
    </div>
  );
}
