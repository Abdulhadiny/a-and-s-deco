import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { CategoryForm } from "@/components/shared/category-form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Layers, Info } from "lucide-react";
import { ProductsTable } from "./client";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog"
        description="Manage item categories and catalog settings"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProductsTable categories={categories} />
        </div>

        <div className="space-y-6">
          <Card className="border-border bg-card shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Layers className="h-4 w-4" />
                <CardTitle className="text-sm font-bold uppercase tracking-wider">Quick Add Category</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Categories help group items in your inventory and quotes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CategoryForm />
            </CardContent>
          </Card>

          <Card className="border-border bg-muted/30 shadow-none">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Info className="h-4 w-4" />
                <CardTitle className="text-xs font-bold uppercase tracking-widest">Catalog Tip</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
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
