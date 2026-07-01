import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { FinanceNav } from "@/components/finance/finance-nav";
import { ExpenseForm } from "@/components/finance/expense-form";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Plus, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExpensesTable } from "./client";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = typeof params.page === "string" ? Math.max(1, parseInt(params.page, 10) || 1) : 1;

  const [[expenses, total], categories, locations] = await Promise.all([
    db.$transaction([
      db.expense.findMany({
        orderBy: { expenseDate: "desc" },
        include: { category: true },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      db.expense.count(),
    ]),
    db.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
    db.location.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildPageHref(p: number) {
    return p > 1 ? `/finance/expenses?page=${p}` : "/finance/expenses";
  }

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

      <ExpensesTable expenses={expenses.map(e => ({ ...e, amount: Number(e.amount) }))} />

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground tabular-nums">
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              render={page > 1 ? <Link href={buildPageHref(page - 1)} /> : undefined}
              disabled={page <= 1}
            >
              <ChevronLeftIcon className="size-4" />
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              render={page < totalPages ? <Link href={buildPageHref(page + 1)} /> : undefined}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
