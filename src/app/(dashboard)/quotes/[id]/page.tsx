import Link from "next/link";
import { notFound } from "next/navigation";
import { getQuote } from "@/lib/actions/quotes";
import { QuoteStatus } from "@/generated/prisma";
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
import { QuoteLineEditor } from "./quote-line-editor";
import { QuoteActions } from "./quote-actions";
import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  UserIcon,
  FileTextIcon,
  DownloadIcon,
} from "lucide-react";
import { format } from "date-fns";

type QuoteDetail = NonNullable<Awaited<ReturnType<typeof getQuote>>>;
type QuoteLineEntry = QuoteDetail["lines"][number];

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function quoteStatusBadge(status: QuoteStatus) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline">Draft</Badge>;
    case "SENT":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400">
          Sent
        </Badge>
      );
    case "ACCEPTED":
      return <Badge variant="default">Accepted</Badge>;
    case "DECLINED":
      return <Badge variant="destructive">Declined</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default async function QuoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = await getQuote(id);

  if (!quote) {
    notFound();
  }

  const lines = quote.lines.map((l: QuoteLineEntry) => ({
    id: l.id,
    description: l.description,
    quantity: l.quantity,
    unitPrice: Number(l.unitPrice),
    lineTotal: Number(l.lineTotal),
  }));

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            render={<Link href={`/events/${quote.eventId}`} />}
          >
            <ArrowLeftIcon />
            <span className="sr-only">Back to event</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">
              Quote
            </h1>
            <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <FileTextIcon className="size-3" />
                {quote.event.title}
              </span>
              {quote.event.customer && (
                <>
                  <span className="text-muted-foreground/50">|</span>
                  <span className="flex items-center gap-1">
                    <UserIcon className="size-3" />
                    {quote.event.customer.name}
                  </span>
                </>
              )}
              <span className="text-muted-foreground/50">|</span>
              <span className="flex items-center gap-1">
                <CalendarDaysIcon className="size-3" />
                {format(new Date(quote.createdAt), "MMM d, yyyy")}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {quoteStatusBadge(quote.status)}
          <Button
            variant="outline"
            size="sm"
            render={
              <Link
                href={`/quotes/${quote.id}/pdf`}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            <DownloadIcon />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Status actions */}
      <QuoteActions quoteId={quote.id} currentStatus={quote.status} />

      <Separator />

      {/* Quote body */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column: Summary card */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Event</dt>
                  <dd className="font-medium">
                    <Link
                      href={`/events/${quote.eventId}`}
                      className="text-primary underline-offset-2 hover:underline"
                    >
                      {quote.event.title}
                    </Link>
                  </dd>
                </div>
                <Separator />
                {quote.event.customer && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Customer</dt>
                      <dd className="font-medium">
                        <Link
                          href={`/customers/${quote.event.customer.id}`}
                          className="text-primary underline-offset-2 hover:underline"
                        >
                          {quote.event.customer.name}
                        </Link>
                      </dd>
                    </div>
                    <Separator />
                  </>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Lines</dt>
                  <dd className="font-medium">{quote.lines.length}</dd>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-medium">
                    {formatNGN.format(Number(quote.subtotal))}
                  </dd>
                </div>
                {quote.discount && Number(quote.discount) > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Discount</dt>
                      <dd className="font-medium text-destructive">
                        -{formatNGN.format(Number(quote.discount))}
                      </dd>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between">
                  <dt className="font-medium">Total</dt>
                  <dd className="text-base font-bold">
                    {formatNGN.format(Number(quote.total))}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Line items editor */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
              <CardDescription>
                Edit quantities, prices, and add freeform lines
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuoteLineEditor
                quoteId={quote.id}
                initialLines={lines}
                initialDiscount={Number(quote.discount ?? 0)}
                initialNotes={quote.notes ?? ""}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
