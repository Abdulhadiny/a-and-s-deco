import { db } from "../db";
import { PaymentStatus, AuditAction } from "@/generated/prisma";
import { logAction } from "../audit";

/**
 * The Finance Engine handles payments, quotes, and expense reconciliation.
 */
export const FinanceEngine = {
  /**
   * Records a payment from a customer and updates the related quote/event status.
   */
  async recordPayment({
    customerId,
    quoteId,
    amount,
    paymentDate,
    paymentMethod,
    reference,
    notes,
    createdBy,
  }: {
    customerId: string;
    quoteId?: string;
    amount: number;
    paymentDate: Date;
    paymentMethod?: string;
    reference?: string;
    notes?: string;
    createdBy: string;
  }) {
    return await db.$transaction(async (tx) => {
      // 1. Create the payment record
      const payment = await tx.customerPayment.create({
        data: {
          customerId,
          amount,
          paymentDate,
          paymentMethod,
          reference,
          notes,
          createdBy,
        },
      });

      await logAction({
        userId: createdBy,
        action: AuditAction.create,
        module: "finance",
        recordId: payment.id,
        recordTable: "customer_payments",
        newValues: payment,
        ipAddress: "system",
      });

      // 2. If linked to a quote, update its paid amount and status
      if (quoteId) {
        const quote = await tx.quote.findUnique({ where: { id: quoteId } });
        if (quote) {
          const newAmountPaid = Number(quote.amountPaid) + amount;
          const total = Number(quote.total);

          let status: PaymentStatus = PaymentStatus.partial;
          if (newAmountPaid >= total) {
            status = PaymentStatus.reconciled;
          }

          const updatedQuote = await tx.quote.update({
            where: { id: quoteId },
            data: {
              amountPaid: newAmountPaid,
              paymentStatus: status,
            },
          });

          await logAction({
            userId: createdBy,
            action: AuditAction.update,
            module: "finance",
            recordId: quoteId,
            recordTable: "quotes",
            newValues: updatedQuote,
            ipAddress: "system",
          });
        }
      }

      return payment;
    });
  },

  /**
   * Records an operational expense.
   */
  async recordExpense({
    categoryId,
    amount,
    expenseDate,
    description,
    locationId,
    createdBy,
    tx: externalTx,
  }: {
    categoryId: string;
    amount: number;
    expenseDate: Date;
    description?: string;
    locationId?: string;
    createdBy: string;
    tx?: any;
  }) {
    const client = externalTx || db;
    const expense = await client.expense.create({
      data: {
        categoryId,
        amount,
        expenseDate,
        description,
        locationId,
        createdBy,
      },
    });

    await logAction({
      userId: createdBy,
      action: AuditAction.create,
      module: "finance",
      recordId: expense.id,
      recordTable: "expenses",
      newValues: expense,
      ipAddress: "system",
    });

    return expense;
  }
};
