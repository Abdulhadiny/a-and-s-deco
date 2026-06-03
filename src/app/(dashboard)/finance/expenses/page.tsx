import { PageHeader } from "@/components/shared/page-header";
import { FinanceNav } from "@/components/finance/finance-nav";
import { ExpenseForm } from "@/components/finance/expense-form";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExpensesTable } from "./client";

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
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Record Expense</DialogTitle>
            </DialogHeader>
            <ExpenseForm categories={categories} locations={locations} />
          </DialogContent>
        </Dialog>
      </div>
      
      <FinanceNav />

      <ExpensesTable expenses={expenses} />
    </div>
  );
}
