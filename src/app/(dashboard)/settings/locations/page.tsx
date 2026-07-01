import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { Plus } from "lucide-react";
import { LocationsTable } from "./client";

export const dynamic = "force-dynamic";

export default async function LocationsPage() {
  const locations = await db.location.findMany({
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Locations"
        description="Manage warehouses, offices, and event sites"
        backHref="/settings"
        action={{
          label: "Add Location",
          icon: Plus,
          href: "/settings/locations/new",
        }}
      />

      <LocationsTable locations={locations} />
    </div>
  );
}
