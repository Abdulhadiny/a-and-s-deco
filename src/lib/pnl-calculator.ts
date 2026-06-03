import { db } from "./db";

/**
 * Calculates Profit & Loss metrics for a given period.
 */
export async function calculatePnL(startDate: Date, endDate: Date) {
  // 1. Total Income (Actual payments received)
  const income = await db.customerPayment.aggregate({
    where: {
      paymentDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  // 2. Total Expenses
  const expenses = await db.expense.aggregate({
    where: {
      expenseDate: { gte: startDate, lte: endDate },
    },
    _sum: { amount: true },
  });

  const totalIncome = Number(income._sum.amount || 0);
  const totalExpenses = Number(expenses._sum.amount || 0);

  const netProfit = totalIncome - totalExpenses;

  return {
    totalIncome,
    totalExpenses,
    netProfit,
    breakdown: {
      sales: totalIncome,
      expenses: totalExpenses,
    },
  };
}
