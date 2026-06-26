import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { ExpenseCategoryForm } from "@/components/shared/expense-category-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wallet, Info } from "lucide-react";
import { ExpenseCategoriesTable } from "./client";

export const dynamic = "force-dynamic";

export default async function ExpenseCategoriesPage() {
  const categories = await db.expenseCategory.findMany({
    include: {
      _count: {
        select: { expenses: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Categories"
        description="Manage categories for logging operational expenses"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ExpenseCategoriesTable categories={categories} />
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Wallet className="h-4 w-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Add Category</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Expense categories help group business costs for P&L reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExpenseCategoryForm />
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/30 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest">Finance Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Categories defined here are available when recording expenses in the Finance module. 
                Keep category names clear and distinct for accurate financial insights.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
