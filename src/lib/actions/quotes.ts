"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { QuoteStatus } from "@/generated/prisma";

export async function getQuote(id: string) {
  return db.quote.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { id: "asc" } },
      event: { include: { customer: true } },
    },
  });
}

export async function createQuoteFromEvent(eventId: string) {
  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      eventItems: { include: { item: true } },
    },
  });
  if (!event) throw new Error("Event not found");

  // Build lines from allocated items
  const lines = event.eventItems.map((ei) => ({
    description: `${ei.item.name} (${ei.item.tag})`,
    quantity: 1,
    unitPrice: ei.item.rentalPrice,
    lineTotal: ei.item.rentalPrice,
  }));

  const subtotal = lines.reduce(
    (sum, l) => sum + Number(l.lineTotal),
    0
  );

  const quote = await db.quote.create({
    data: {
      eventId,
      subtotal,
      total: subtotal,
      lines: { create: lines },
    },
    include: { lines: true },
  });

  revalidatePath(`/events/${eventId}`);
  return quote;
}

export async function updateQuoteLines(
  quoteId: string,
  lines: { id?: string; description: string; quantity: number; unitPrice: number }[]
) {
  // Delete existing lines and recreate
  await db.quoteLine.deleteMany({ where: { quoteId } });

  const newLines = lines.map((l) => ({
    quoteId,
    description: l.description,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.quantity * l.unitPrice,
  }));

  await db.quoteLine.createMany({ data: newLines });

  const subtotal = newLines.reduce((sum, l) => sum + Number(l.lineTotal), 0);

  const quote = await db.quote.update({
    where: { id: quoteId },
    data: { subtotal },
    include: { event: true },
  });

  // Recalculate total with existing discount
  const discount = Number(quote.discount ?? 0);
  await db.quote.update({
    where: { id: quoteId },
    data: { total: subtotal - discount },
  });

  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/events/${quote.eventId}`);
}

export async function updateQuoteDiscount(quoteId: string, discount: number) {
  const quote = await db.quote.findUnique({ where: { id: quoteId } });
  if (!quote) throw new Error("Quote not found");

  await db.quote.update({
    where: { id: quoteId },
    data: {
      discount,
      total: Number(quote.subtotal) - discount,
    },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteNotes(quoteId: string, notes: string) {
  await db.quote.update({
    where: { id: quoteId },
    data: { notes: notes.trim() || null },
  });
  revalidatePath(`/quotes/${quoteId}`);
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus) {
  const quote = await db.quote.update({
    where: { id: quoteId },
    data: { status },
    include: { event: true },
  });
  revalidatePath(`/quotes/${quoteId}`);
  revalidatePath(`/events/${quote.eventId}`);
}
