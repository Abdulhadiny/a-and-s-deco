import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { DataTable, Column } from "@/components/shared/data-table";
import { CategoryForm } from "@/components/shared/category-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Package, Layers, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductCatalogPage() {
  const categories = await db.itemCategory.findMany({
    include: {
      _count: {
        select: { items: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const columns: Column<any>[] = [
    {
      key: "name",
      header: "Category Name",
      cell: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-zinc-100">{row.name}</span>
          {row.description && <span className="text-xs text-zinc-500 line-clamp-1">{row.description}</span>}
        </div>
      ),
    },
    {
      key: "itemCount",
      header: "Total Items",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Package className="h-3 w-3 text-zinc-500" />
          <span className="text-zinc-300">{row._count.items}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description="Manage item categories and catalog settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={categories}
            emptyMessage="No categories found."
          />
        </div>

        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-950 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Layers className="h-4 w-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Add Category</CardTitle>
              </div>
              <CardDescription className="text-xs text-zinc-500">
                Categories help group items in your inventory and quotes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm />
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/30 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Info className="h-4 w-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest">Catalog Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Existing items are managed in the main Inventory section. 
                Use this page to define the structural groups for your business.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
