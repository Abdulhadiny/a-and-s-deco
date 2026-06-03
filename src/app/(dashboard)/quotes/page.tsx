import { db } from "@/lib/db";
import { PageHeader } from "@/components/shared/page-header";
import { getQuotes } from "@/lib/actions/quotes";
import { QuotesTable } from "./client";

export const dynamic = "force-dynamic";

export default async function QuotesPage() {
  const quotes = await getQuotes();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotes"
        description="View and manage generated quotes for all events"
      />

      <QuotesTable quotes={quotes} />
    </div>
  );
}
