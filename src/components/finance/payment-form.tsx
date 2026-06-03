"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError } from "@/components/ui/field-error";
import { recordPayment } from "@/lib/actions/finance";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { useFormConfirmation } from "@/lib/hooks/use-form-confirmation";

const paymentSchema = z.object({
  customerId: z.string().cuid("Invalid customer ID"),
  quoteId: z.string().cuid("Invalid quote ID").optional().nullable(),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.string().min(1, "Payment date is required"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  reference: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

type PaymentFormValues = z.infer<typeof paymentSchema>;

interface PaymentFormProps {
  customerId: string;
  quoteId?: string;
  defaultAmount?: number;
  onSuccess?: () => void;
}

export function PaymentForm({ customerId, quoteId, defaultAmount, onSuccess }: PaymentFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const { showConfirm, setShowConfirm, pendingData, onPreSubmit, resetConfirmation } = useFormConfirmation<PaymentFormValues>();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      customerId,
      quoteId: quoteId || null,
      amount: defaultAmount || 0,
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "BANK_TRANSFER",
      reference: "",
      notes: "",
    },
  });

  const onConfirmedSubmit = async () => {
    if (!pendingData) return;
    setIsLoading(true);
    setShowConfirm(false);
    try {
      await recordPayment(pendingData);
      toast.success("Payment recorded successfully");
      reset();
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to record payment");
    } finally {
      setIsLoading(false);
      resetConfirmation();
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onPreSubmit)} className="space-y-4">
        <input type="hidden" {...register("customerId")} />
        <input type="hidden" {...register("quoteId")} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Amount (₦)</Label>
            <Input 
              id="amount" 
              type="number"
              step="0.01"
              placeholder="0.00" 
              className="bg-muted border-border text-foreground h-10 font-medium"
              {...register("amount", { valueAsNumber: true })} 
            />
            <FieldError error={errors.amount} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Payment Date</Label>
            <Input 
              id="paymentDate" 
              type="date"
              className="bg-muted border-border text-foreground h-10"
              {...register("paymentDate")} 
            />
            <FieldError error={errors.paymentDate} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paymentMethod" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Payment Method</Label>
            <select
              id="paymentMethod"
              className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              {...register("paymentMethod")}
            >
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="POS">POS / Card</option>
              <option value="CHEQUE">Cheque</option>
            </select>
            <FieldError error={errors.paymentMethod} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Reference No.</Label>
            <Input 
              id="reference" 
              placeholder="e.g. TRX-12345 (Optional)" 
              className="bg-muted border-border text-foreground h-10"
              {...register("reference")} 
            />
            <FieldError error={errors.reference} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-foreground/80 font-semibold text-xs uppercase tracking-wider">Notes (Optional)</Label>
          <Textarea 
            id="notes" 
            placeholder="Additional details about this payment..." 
            className="bg-muted border-border text-foreground min-h-[80px] resize-none"
            {...register("notes")} 
          />
          <FieldError error={errors.notes} />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full font-bold h-10">
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Record Payment
        </Button>
      </form>

      <ConfirmationDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        onConfirm={onConfirmedSubmit}
        title="Confirm Payment"
        description="Are you sure you want to record this payment? This action will update the customer's ledger."
        confirmLabel="Yes, Record Payment"
        isLoading={isLoading}
      />
    </>
  );
}
