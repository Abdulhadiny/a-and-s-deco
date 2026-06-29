"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordExpense } from "@/lib/actions/finance";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

interface Category {
  id: string;
  name: string;
}

interface Location {
  id: string;
  name: string;
}

export function ExpenseForm({
  categories,
  locations,
}: {
  categories: Category[];
  locations: Location[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<{ categoryId: string; locationId?: string; amount: number; expenseDate: string; description?: string } | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      categoryId: formData.get("categoryId") as string,
      locationId: (formData.get("locationId") as string) || undefined,
      amount: Number(formData.get("amount")),
      expenseDate: formData.get("expenseDate") as string,
      description: (formData.get("description") as string) || undefined,
    };

    if (!data.categoryId || !data.amount || !data.expenseDate) {
      toast.error("Please fill all required fields");
      return;
    }

    setPendingData(data);
    setShowConfirm(true);
  }

  async function handleConfirmedSubmit() {
    if (!pendingData) return;
    setShowConfirm(false);
    setIsLoading(true);
    try {
      await recordExpense(pendingData);
      toast.success("Expense recorded successfully");
      formRef.current?.reset();
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setIsLoading(false);
      setPendingData(null);
    }
  }

  const selectClass = "flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent";

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor="categoryId" className="text-foreground/80">Category</Label>
        <select id="categoryId" name="categoryId" className={selectClass} required>
          <option value="">Select Category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="locationId" className="text-foreground/80">Location (Optional)</Label>
        <select id="locationId" name="locationId" className={selectClass}>
          <option value="">Global / N/A</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-foreground/80">Amount (₦)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="bg-muted border-border text-foreground h-10"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="expenseDate" className="text-foreground/80">Date</Label>
          <Input
            id="expenseDate"
            name="expenseDate"
            type="date"
            defaultValue={new Date().toISOString().split("T")[0]}
            required
            className="bg-muted border-border text-foreground h-10"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground/80">Description (Optional)</Label>
        <Textarea
          id="description"
          name="description"
          className="bg-muted border-border text-foreground min-h-[80px]"
        />
      </div>

      <Button type="submit" disabled={isLoading} className="w-full font-bold">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save Expense
      </Button>
    </form>
    <ConfirmationDialog
      open={showConfirm}
      onOpenChange={setShowConfirm}
      onConfirm={handleConfirmedSubmit}
      title="Record Expense"
      description="Record this expense entry?"
      confirmLabel="Yes, Record"
      isLoading={isLoading}
    />
    </>
  );
}
