"use server";

import { checkPermission } from "@/lib/auth";
import { FinanceEngine } from "@/lib/engines/finance-engine";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { logAction } from "@/lib/audit";
import { AuditAction, NotificationType } from "@/generated/prisma";
import { expenseCategorySchema } from "@/lib/validators";
import { notifyAll } from "@/lib/notifications";
import { formatCurrency } from "@/lib/utils/currency";

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
  const session = await checkPermission("finance:manage");

  const [payment, customer] = await Promise.all([
    FinanceEngine.recordPayment({
      customerId: data.customerId,
      quoteId: data.quoteId || undefined,
      amount: Number(data.amount),
      paymentDate: new Date(data.paymentDate),
      paymentMethod: data.paymentMethod,
      reference: data.reference || undefined,
      notes: data.notes || undefined,
      createdBy: session.user.id!,
    }),
    db.customer.findUnique({ where: { id: data.customerId }, select: { name: true } }),
  ]);

  revalidatePath(`/customers/${data.customerId}`);
  if (data.quoteId) {
    revalidatePath(`/quotes/${data.quoteId}`);
  }
  revalidatePath("/finance");

  await notifyAll({
    title: "Payment Received",
    message: `Payment of ${formatCurrency(data.amount)} received from ${customer?.name ?? "customer"}`,
    type: NotificationType.PAYMENT_RECEIVED,
    link: "/finance",
  });
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
  const session = await checkPermission("finance:manage");

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

/**
 * Creates a new expense category.
 */
export async function createExpenseCategory(data: unknown) {
  const session = await checkPermission("finance:manage");

  const validated = expenseCategorySchema.parse(data);

  const category = await db.expenseCategory.create({
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "finance",
    recordId: category.id,
    recordTable: "expense_categories",
    newValues: category,
  });

  revalidatePath("/settings/expense-categories");
  return category;
}

/**
 * Updates an existing expense category.
 */
export async function updateExpenseCategory(id: string, data: unknown) {
  const session = await checkPermission("finance:manage");

  const validated = expenseCategorySchema.parse(data);

  const oldValues = await db.expenseCategory.findUnique({ where: { id } });
  if (!oldValues) throw new Error("Category not found");

  const category = await db.expenseCategory.update({
    where: { id },
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "finance",
    recordId: category.id,
    recordTable: "expense_categories",
    oldValues,
    newValues: category,
  });

  revalidatePath("/settings/expense-categories");
  return category;
}
