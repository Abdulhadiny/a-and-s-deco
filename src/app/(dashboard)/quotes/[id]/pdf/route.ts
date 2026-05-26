import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import { db } from "@/lib/db";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    padding: 40,
    color: "#1a1a1a",
  },
  // Header
  header: {
    marginBottom: 24,
  },
  businessName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  businessDetail: {
    fontSize: 9,
    color: "#555",
    marginBottom: 2,
  },
  // Quote info row
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 12,
    borderBottom: "1 solid #e5e5e5",
  },
  infoBlock: {
    flexDirection: "column",
    gap: 3,
  },
  infoLabel: {
    fontSize: 8,
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  // Customer
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  customerBlock: {
    marginBottom: 20,
  },
  customerName: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  customerDetail: {
    fontSize: 9,
    color: "#555",
    marginBottom: 1,
  },
  // Table
  table: {
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottom: "1 solid #1a1a1a",
    paddingBottom: 6,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    borderBottom: "1 solid #f0f0f0",
  },
  colDescription: {
    flex: 1,
  },
  colQty: {
    width: 50,
    textAlign: "center",
  },
  colUnitPrice: {
    width: 90,
    textAlign: "right",
  },
  colTotal: {
    width: 90,
    textAlign: "right",
  },
  headerText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cellText: {
    fontSize: 10,
  },
  // Totals
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 24,
  },
  totalsRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  totalsDivider: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTop: "1 solid #1a1a1a",
    marginTop: 2,
  },
  totalsLabel: {
    fontSize: 10,
    color: "#555",
  },
  totalsValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalLabel: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  grandTotalValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  // Notes
  notesSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: "#f9f9f9",
    borderRadius: 4,
  },
  notesTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 9,
    color: "#555",
    lineHeight: 1.5,
  },
  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#aaa",
  },
});

const formatNGN = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
});

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function QuoteDocument({
  quote,
}: {
  quote: {
    id: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    notes: string | null;
    createdAt: Date;
    event: {
      title: string;
      customer: { name: string; phone: string | null; email: string | null; address: string | null } | null;
    };
    lines: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  };
}) {
  return React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      // Header
      React.createElement(
        View,
        { style: styles.header },
        React.createElement(Text, { style: styles.businessName }, "A&S Decorations"),
        React.createElement(
          Text,
          { style: styles.businessDetail },
          "Kano, Nigeria"
        ),
        React.createElement(
          Text,
          { style: styles.businessDetail },
          "Phone: 08012345678"
        ),
      ),
      // Quote info row
      React.createElement(
        View,
        { style: styles.infoRow },
        React.createElement(
          View,
          { style: styles.infoBlock },
          React.createElement(Text, { style: styles.infoLabel }, "Quote Number"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            quote.id.slice(-8).toUpperCase()
          ),
        ),
        React.createElement(
          View,
          { style: styles.infoBlock },
          React.createElement(Text, { style: styles.infoLabel }, "Date"),
          React.createElement(
            Text,
            { style: styles.infoValue },
            formatDate(quote.createdAt)
          ),
        ),
        React.createElement(
          View,
          { style: styles.infoBlock },
          React.createElement(Text, { style: styles.infoLabel }, "Status"),
          React.createElement(Text, { style: styles.infoValue }, quote.status),
        ),
      ),
      // Customer info
      quote.event.customer &&
        React.createElement(
          View,
          { style: styles.customerBlock },
          React.createElement(Text, { style: styles.sectionTitle }, "Bill To"),
          React.createElement(
            Text,
            { style: styles.customerName },
            quote.event.customer.name
          ),
          quote.event.customer.phone &&
            React.createElement(
              Text,
              { style: styles.customerDetail },
              quote.event.customer.phone
            ),
          quote.event.customer.email &&
            React.createElement(
              Text,
              { style: styles.customerDetail },
              quote.event.customer.email
            ),
          quote.event.customer.address &&
            React.createElement(
              Text,
              { style: styles.customerDetail },
              quote.event.customer.address
            ),
        ),
      // Event title
      React.createElement(
        View,
        { style: { marginBottom: 16 } },
        React.createElement(Text, { style: styles.sectionTitle }, "Event"),
        React.createElement(
          Text,
          { style: { fontSize: 11, fontFamily: "Helvetica-Bold" } },
          quote.event.title
        ),
      ),
      // Line items table
      React.createElement(
        View,
        { style: styles.table },
        // Table header
        React.createElement(
          View,
          { style: styles.tableHeader },
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colDescription } },
            "Description"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colQty } },
            "Qty"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colUnitPrice } },
            "Unit Price"
          ),
          React.createElement(
            Text,
            { style: { ...styles.headerText, ...styles.colTotal } },
            "Total"
          ),
        ),
        // Table rows
        ...quote.lines.map((line, i) =>
          React.createElement(
            View,
            { key: i, style: styles.tableRow },
            React.createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colDescription } },
              line.description
            ),
            React.createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colQty } },
              String(line.quantity)
            ),
            React.createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colUnitPrice } },
              formatNGN.format(line.unitPrice)
            ),
            React.createElement(
              Text,
              { style: { ...styles.cellText, ...styles.colTotal } },
              formatNGN.format(line.lineTotal)
            ),
          )
        ),
      ),
      // Totals
      React.createElement(
        View,
        { style: styles.totalsSection },
        React.createElement(
          View,
          { style: styles.totalsRow },
          React.createElement(Text, { style: styles.totalsLabel }, "Subtotal"),
          React.createElement(
            Text,
            { style: styles.totalsValue },
            formatNGN.format(quote.subtotal)
          ),
        ),
        quote.discount > 0 &&
          React.createElement(
            View,
            { style: styles.totalsRow },
            React.createElement(
              Text,
              { style: styles.totalsLabel },
              "Discount"
            ),
            React.createElement(
              Text,
              { style: { ...styles.totalsValue, color: "#dc2626" } },
              "-" + formatNGN.format(quote.discount)
            ),
          ),
        React.createElement(
          View,
          { style: styles.totalsDivider },
          React.createElement(
            Text,
            { style: styles.grandTotalLabel },
            "Total"
          ),
          React.createElement(
            Text,
            { style: styles.grandTotalValue },
            formatNGN.format(quote.total)
          ),
        ),
      ),
      // Notes
      quote.notes &&
        React.createElement(
          View,
          { style: styles.notesSection },
          React.createElement(Text, { style: styles.notesTitle }, "Notes"),
          React.createElement(
            Text,
            { style: styles.notesText },
            quote.notes
          ),
        ),
      // Footer
      React.createElement(
        Text,
        { style: styles.footer },
        "A&S Decorations - Thank you for your business!"
      ),
    ),
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const quote = await db.quote.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { id: "asc" } },
      event: {
        include: {
          customer: true,
        },
      },
    },
  });

  if (!quote) {
    return Response.json({ error: "Quote not found" }, { status: 404 });
  }

  const quoteData = {
    id: quote.id,
    status: quote.status,
    subtotal: Number(quote.subtotal),
    discount: Number(quote.discount ?? 0),
    total: Number(quote.total),
    notes: quote.notes,
    createdAt: quote.createdAt,
    event: {
      title: quote.event.title,
      customer: quote.event.customer
        ? {
            name: quote.event.customer.name,
            phone: quote.event.customer.phone,
            email: quote.event.customer.email,
            address: quote.event.customer.address,
          }
        : null,
    },
    lines: quote.lines.map((l: typeof quote.lines[number]) => ({
      description: l.description,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      lineTotal: Number(l.lineTotal),
    })),
  };

  const buffer = await renderToBuffer(
    React.createElement(QuoteDocument, { quote: quoteData }) as any
  );

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="quote-${quote.id.slice(-8).toUpperCase()}.pdf"`,
    },
  });
}
