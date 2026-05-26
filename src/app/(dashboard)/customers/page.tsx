import Link from "next/link";
import { Suspense } from "react";
import { getCustomers } from "@/lib/actions/customers";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerSearch } from "@/components/customers/customer-search";
import { CustomerFormDialog } from "@/components/customers/customer-form";
import {
  UsersIcon,
  PhoneIcon,
  MailIcon,
  CalendarDaysIcon,
} from "lucide-react";

type CustomerEntry = Awaited<ReturnType<typeof getCustomers>>[number];

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const search =
    typeof params.search === "string" ? params.search : undefined;

  const customers = await getCustomers(search);

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            Customers
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your customer contacts and history
          </p>
        </div>
        <CustomerFormDialog />
      </div>

      <Separator />

      {/* Search */}
      <Suspense fallback={null}>
        <CustomerSearch currentSearch={search} />
      </Suspense>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        {customers.length} customer{customers.length !== 1 ? "s" : ""} found
      </p>

      {/* Customer grid */}
      {customers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <UsersIcon className="size-10 text-muted-foreground" />
            <div>
              <p className="font-medium">No customers found</p>
              <p className="text-sm text-muted-foreground">
                {search
                  ? "Try adjusting your search."
                  : "Get started by adding your first customer."}
              </p>
            </div>
            {!search && <CustomerFormDialog />}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {customers.map((customer: CustomerEntry) => (
            <Link
              key={customer.id}
              href={`/customers/${customer.id}`}
              className="group"
            >
              <Card className="h-full transition-shadow hover:ring-2 hover:ring-primary/20">
                <CardContent className="flex flex-col gap-3">
                  {/* Name and avatar */}
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium group-hover:text-primary">
                        {customer.name}
                      </p>
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <PhoneIcon className="size-3" />
                          {customer.phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  {customer.email && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MailIcon className="size-3" />
                      <span className="truncate">{customer.email}</span>
                    </div>
                  )}

                  {/* Event count */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <CalendarDaysIcon className="size-3" />
                    {customer._count.events} event
                    {customer._count.events !== 1 ? "s" : ""}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
