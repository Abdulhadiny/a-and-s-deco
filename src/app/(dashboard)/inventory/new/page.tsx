import Link from "next/link";
import { getCategories } from "@/lib/actions/inventory";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon } from "lucide-react";
import { NewItemForm } from "@/components/inventory/new-item-form";

type CategoryEntry = Awaited<ReturnType<typeof getCategories>>[number];

export default async function NewItemPage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          render={<Link href="/inventory" />}
        >
          <ArrowLeftIcon />
          <span className="sr-only">Back to inventory</span>
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Add Items
          </h1>
          <p className="text-sm text-muted-foreground">
            Add a single item or create items in bulk
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Inventory Item</CardTitle>
          <CardDescription>
            Use the &quot;Single Item&quot; tab to add one item at a time, or
            &quot;Bulk Add&quot; to quickly generate multiple items with
            sequential tags.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewItemForm
            categories={categories.map((c: CategoryEntry) => ({ id: c.id, name: c.name }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
