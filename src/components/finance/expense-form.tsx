"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoneyInput } from "@/components/ui/money-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [categoryId, setCategoryId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [amount, setAmount] = useState(0);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {
      categoryId,
      locationId: locationId || undefined,
      amount,
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
      setCategoryId("");
      setLocationId("");
      setAmount(0);
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setIsLoading(false);
      setPendingData(null);
    }
  }

  return (
    <>
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label className="text-foreground/80">Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select Category">
              {categories.find((c) => c.id === categoryId)?.name}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground/80">Location (Optional)</Label>
        <Select
          value={locationId || "__none__"}
          onValueChange={(v) => setLocationId(v === "__none__" ? "" : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Global / N/A">
              {locationId ? locations.find((l) => l.id === locationId)?.name : "Global / N/A"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Global / N/A</SelectItem>
            {locations.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-foreground/80">Amount (₦)</Label>
          <MoneyInput
            id="amount"
            name="amount"
            defaultValue={0}
            onChange={setAmount}
            disabled={isLoading}
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
