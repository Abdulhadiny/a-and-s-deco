"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { FinanceEngine } from "@/lib/engines/finance-engine";
import { revalidatePath } from "next/cache";

/**
 * Records a payment against a customer account and optionally a specific quote.
 */
export async function recordPayment(data: {
  customerId: string;
  quoteId?: string | null;
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
  reference?: string | null;
  notes?: string | null;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const payment = await FinanceEngine.recordPayment({
    customerId: data.customerId,
    quoteId: data.quoteId || undefined,
    amount: Number(data.amount),
    paymentDate: new Date(data.paymentDate),
    paymentMethod: data.paymentMethod,
    reference: data.reference || undefined,
    notes: data.notes || undefined,
    createdBy: session.user.id!,
  });

  revalidatePath(`/customers/${data.customerId}`);
  if (data.quoteId) {
    revalidatePath(`/quotes/${data.quoteId}`);
  }
  revalidatePath("/finance");

  return payment;
}

/**
 * Records an operational expense.
 */
export async function recordExpense(data: {
  categoryId: string;
  locationId?: string;
  amount: number;
  expenseDate: string | Date;
  description?: string;
}) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const expense = await FinanceEngine.recordExpense({
    categoryId: data.categoryId,
    locationId: data.locationId,
    amount: Number(data.amount),
    expenseDate: new Date(data.expenseDate),
    description: data.description,
    createdBy: session.user.id!,
  });

  revalidatePath("/finance");
  revalidatePath("/finance/expenses");
  revalidatePath("/finance/pnl");

  return expense;
}
