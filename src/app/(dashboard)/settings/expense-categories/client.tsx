"use client";

import { useState } from "react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Wallet, Edit2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExpenseCategoryForm } from "@/components/shared/expense-category-form";

interface ExpenseCategoryData {
  id: string;
  name: string;
  isActive: boolean;
  _count?: {
    expenses: number;
  };
}

export function ExpenseCategoriesTable({ categories }: { categories: ExpenseCategoryData[] }) {
  const [editingCategory, setEditingCategory] = useState<ExpenseCategoryData | null>(null);

  const columns: Column<ExpenseCategoryData>[] = [
    {
      key: "name",
      header: "Category Name",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="h-4 w-4" />
          </div>
          <span className="font-semibold text-foreground">{row.name}</span>
        </div>
      ),
    },
    {
      key: "expenseCount",
      header: "Total Expenses",
      cell: (row) => (
        <span className="text-foreground/80 font-medium">
          {row._count?.expenses || 0}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.isActive ? "active" : "inactive"} />,
    },
    {
      key: "actions",
      header: "",
      className: "text-right",
      cell: (row) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-white"
          onClick={() => setEditingCategory(row)}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <>
      <DataTable
        columns={columns}
        data={categories}
        emptyMessage="No expense categories found. Add your first category on the right."
      />

      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent className="sm:max-w-[425px] bg-card border-border text-foreground p-6">
          <DialogHeader className="pb-4">
            <DialogTitle>Edit Expense Category</DialogTitle>
          </DialogHeader>
          {editingCategory && (
            <ExpenseCategoryForm
              initialData={editingCategory}
              onSuccess={() => setEditingCategory(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
