import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomer } from "@/lib/actions/customers";
import { db } from "@/lib/db";
import { EventStatus } from "@/generated/prisma";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CustomerForm } from "@/components/customers/customer-form";
import { PaymentForm } from "@/components/finance/payment-form";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  ArrowLeftIcon,
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  CalendarDaysIcon,
  PackageIcon,
  StickyNoteIcon,
  Wallet,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";

type CustomerDetail = NonNullable<Awaited<ReturnType<typeof getCustomer>>>;
type EventEntry = CustomerDetail["events"][number];

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [customer, payments, quotes] = await Promise.all([
    getCustomer(id),
    db.customerPayment.findMany({
      where: { customerId: id },
      orderBy: { paymentDate: "desc" },
    }),
    db.quote.findMany({
      where: { event: { customerId: id } },
      include: { event: true },
    }),
  ]);

  if (!customer) {
    notFound();
  }

  // Calculate Financials
  const totalBilled = quotes.reduce((acc, q) => acc + Number(q.total), 0);
  const totalPaid = payments.reduce((acc, p) => acc + Number(p.amount), 0);
  const outstandingBalance = Math.max(0, totalBilled - totalPaid);

  const paymentColumns: Column<any>[] = [
    {
      key: "date",
      header: "Date",
      cell: (row) => format(new Date(row.paymentDate), "MMM d, yyyy"),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => <span className="font-semibold text-emerald-500">{formatNGN.format(Number(row.amount))}</span>,
    },
    {
      key: "method",
      header: "Method",
      cell: (row) => <span className="text-xs text-zinc-400">{row.paymentMethod.replace("_", " ")}</span>,
    },
    {
      key: "ref",
      header: "Ref",
      cell: (row) => <span className="text-xs text-zinc-500">{row.reference || "—"}</span>,
      className: "hidden md:table-cell",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-white"
            render={<Link href="/customers" />}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to customers</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white md:text-2xl">
              {customer.name}
            </h1>
            <p className="text-sm text-zinc-400">
              Customer ID: {customer.id.substring(0, 8)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Info & Stats */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Financial Summary */}
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                Ledger Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">Total Billed</span>
                  <span className="text-sm font-medium text-zinc-200">{formatNGN.format(totalBilled)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm text-zinc-400">Total Paid</span>
                  <span className="text-sm font-medium text-emerald-500">{formatNGN.format(totalPaid)}</span>
                </div>
                <Separator className="bg-zinc-800" />
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-zinc-100">Balance</span>
                  <span className={`text-base font-bold ${outstandingBalance > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                    {formatNGN.format(outstandingBalance)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-100">Contact Info</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                {customer.phone && (
                  <>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <PhoneIcon className="size-4 text-zinc-500" />
                      <dd className="font-medium">{customer.phone}</dd>
                    </div>
                    <Separator className="bg-zinc-800" />
                  </>
                )}
                {customer.email && (
                  <>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <MailIcon className="size-4 text-zinc-500" />
                      <dd className="font-medium">{customer.email}</dd>
                    </div>
                    <Separator className="bg-zinc-800" />
                  </>
                )}
                {customer.address && (
                  <>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <MapPinIcon className="size-4 text-zinc-500" />
                      <dd className="font-medium">{customer.address}</dd>
                    </div>
                    <Separator className="bg-zinc-800" />
                  </>
                )}
                {customer.notes && (
                  <div className="flex flex-col gap-1 mt-2">
                    <dt className="flex items-center gap-2 text-zinc-500 text-xs font-semibold uppercase tracking-wider">
                      <StickyNoteIcon className="size-3" />
                      Notes
                    </dt>
                    <dd className="text-zinc-400 mt-1 bg-zinc-900/50 p-2 rounded-md">{customer.notes}</dd>
                  </div>
                )}
                {!customer.phone &&
                  !customer.email &&
                  !customer.address &&
                  !customer.notes && (
                    <p className="py-2 text-center text-zinc-500">
                      No contact details on file.
                    </p>
                  )}
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Actions & History */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Record Payment Form */}
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary" />
                Record Payment
              </CardTitle>
              <CardDescription className="text-zinc-400">
                Log a payment received from this customer.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentForm 
                customerId={customer.id} 
                defaultAmount={outstandingBalance > 0 ? outstandingBalance : undefined} 
              />
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-100">Payment History</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={paymentColumns}
                data={payments}
                emptyMessage="No payments recorded yet."
              />
            </CardContent>
          </Card>

          {/* Event history */}
          <Card className="border-zinc-800 bg-zinc-950">
            <CardHeader>
              <CardTitle className="text-zinc-100 flex items-center gap-2">
                <CalendarDaysIcon className="size-5 text-primary" />
                Event History ({customer.events.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.events.length === 0 ? (
                <p className="py-6 text-center text-sm text-zinc-500">
                  No events yet for this customer.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {customer.events.map((event: EventEntry) => (
                    <Link
                      key={event.id}
                      href={`/events/${event.id}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/30 p-3 transition-colors hover:bg-zinc-800/50 hover:border-zinc-700 group"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium text-zinc-200 group-hover:text-white">
                          {event.title}
                        </span>
                        <span className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <CalendarDaysIcon className="size-3" />
                            {format(new Date(event.eventDate), "MMM d, yyyy")}
                          </span>
                          <span className="flex items-center gap-1">
                            <PackageIcon className="size-3" />
                            {event._count.eventItems} item
                            {event._count.eventItems !== 1 ? "s" : ""}
                          </span>
                        </span>
                      </div>
                      <StatusBadge status={event.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
