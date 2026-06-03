import { PageHeader } from "@/components/shared/page-header";
import { FinanceNav } from "@/components/finance/finance-nav";
import { DataTable, Column } from "@/components/shared/data-table";
import { ExpenseForm } from "@/components/finance/expense-form";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { formatCurrency } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/date";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function ExpensesPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const [expenses, categories, locations] = await Promise.all([
    db.expense.findMany({
      orderBy: { expenseDate: "desc" },
      include: { category: true, location: true },
    }),
    db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const columns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => formatDate(row.expenseDate),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => row.category.name,
    },
    {
      key: "description",
      header: "Description",
      cell: (row) => <span className="text-zinc-400">{row.description || "—"}</span>,
    },
    {
      key: "location",
      header: "Location",
      cell: (row) => <span className="text-zinc-400">{row.location?.name || "Global"}</span>,
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-rose-500">{formatCurrency(row.amount)}</span>,
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <PageHeader
            title="Expenses"
            description="Record and track operational costs."
          />
        </div>
        <Dialog>
          <DialogTrigger render={<Button className="font-bold gap-2" />}>
            <Plus className="h-4 w-4" />
            Record Expense
          </DialogTrigger>
          <DialogContent className="bg-zinc-950 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-zinc-100">Record Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm categories={categories} locations={locations} />
          </DialogContent>
        </Dialog>
      </div>
      
      <FinanceNav />

      <DataTable
        columns={columns}
        data={expenses}
        emptyMessage="No expenses recorded yet."
      />
    </div>
  );
}
