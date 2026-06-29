"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EventStatus, ReturnCondition, AuditAction, EventType, QuoteType, QuoteStatus, PaymentStatus } from "@/generated/prisma";
import { reconcileDamagesSchema } from "@/lib/validators";
import { checkPermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { RentalEngine } from "@/lib/engines/rental-engine";
import { getAvailableItems } from "@/lib/availability";

export async function getEvents(filters?: {
  status?: EventStatus;
  month?: number;
  year?: number;
  page?: number;
  pageSize?: number;
}) {
  const { status, month, year, page = 1, pageSize } = filters ?? {};

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (month !== undefined && year !== undefined) {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    where.eventDate = { gte: start, lte: end };
  }

  if (!pageSize) {
    const items = await db.event.findMany({
      where,
      include: {
        customer: true,
        _count: { select: { eventItems: true } },
      },
      orderBy: { eventDate: "asc" },
    });
    return { items, total: items.length };
  }

  const [items, total] = await db.$transaction([
    db.event.findMany({
      where,
      include: {
        customer: true,
        _count: { select: { eventItems: true } },
      },
      orderBy: { eventDate: "asc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.event.count({ where }),
  ]);

  return { items, total };
}

export async function getEvent(id: string) {
  return db.event.findUnique({
    where: { id },
    include: {
      customer: true,
      eventItems: {
        include: { item: { include: { category: true } } },
        orderBy: { allocatedAt: "asc" },
      },
      quotes: {
        include: { lines: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function createEvent(formData: FormData) {
  const session = await checkPermission("events:manage");

  const customerId = formData.get("customerId") as string;
  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const eventDate = formData.get("eventDate") as string;
  const setupDate = formData.get("setupDate") as string | null;
  const returnDate = formData.get("returnDate") as string | null;
  const venue = formData.get("venue") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!customerId || !title?.trim() || !eventType || !eventDate) {
    throw new Error("Missing required fields");
  }

  const event = await db.event.create({
    data: {
      customerId,
      title: title.trim(),
      eventType: eventType as EventType,
      eventDate: new Date(eventDate),
      setupDate: setupDate ? new Date(setupDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      venue: venue?.trim() || null,
      notes: notes?.trim() || null,
    },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "events",
    recordId: event.id,
    recordTable: "events",
    newValues: event,
  });

  revalidatePath("/events");
  return event;
}

export async function updateEvent(id: string, formData: FormData) {
  const session = await checkPermission("events:manage");

  const oldValues = await db.event.findUnique({ where: { id } });
  if (!oldValues) throw new Error("Event not found");

  const customerId = formData.get("customerId") as string;
  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const eventDate = formData.get("eventDate") as string;
  const setupDate = formData.get("setupDate") as string | null;
  const returnDate = formData.get("returnDate") as string | null;
  const venue = formData.get("venue") as string | null;
  const notes = formData.get("notes") as string | null;
  const status = formData.get("status") as EventStatus | null;

  const event = await db.event.update({
    where: { id },
    data: {
      customerId,
      title: title.trim(),
      eventType: eventType as EventType,
      eventDate: new Date(eventDate),
      setupDate: setupDate ? new Date(setupDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      venue: venue?.trim() || null,
      notes: notes?.trim() || null,
      ...(status ? { status } : {}),
    },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "events",
    recordId: event.id,
    recordTable: "events",
    oldValues,
    newValues: event,
  });

  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function allocateItems(eventId: string, itemIds: string[], locationId?: string) {
  const session = await checkPermission("events:manage");

  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  const targetLocationId = locationId || "main-warehouse";

  // Use the new RentalEngine for atomic inventory deduction and assignment
  const itemsToAllocate = itemIds.map(id => ({ itemId: id, quantity: 1 }));
  
  await RentalEngine.allocateItems({
    eventId,
    locationId: targetLocationId,
    items: itemsToAllocate,
    createdBy: session.user.id!,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/inventory"); // Stock counts changed
}

export async function returnItem(
  eventItemId: string,
  condition: "GOOD" | "DAMAGED" | "MISSING",
  locationId?: string,
  damageNotes?: string
) {
  const session = await checkPermission("events:manage");

  const eventItem = await db.eventItem.findUnique({
    where: { id: eventItemId },
    include: { event: true },
  });

  if (!eventItem) throw new Error("Allocation not found");

  const targetLocationId = locationId || "main-warehouse";

  await RentalEngine.returnItems({
    eventId: eventItem.eventId,
    locationId: targetLocationId,
    returns: [
      {
        itemId: eventItem.itemId,
        quantity: eventItem.quantity,
        condition: condition as ReturnCondition,
        notes: damageNotes,
      }
    ],
    createdBy: session.user.id!,
  });

  revalidatePath(`/events/${eventItem.eventId}`);
  revalidatePath("/inventory");
}

export async function getEventsForMonth(year: number, month: number) {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return db.event.findMany({
    where: {
      eventDate: { gte: start, lte: end },
    },
    include: { customer: true },
    orderBy: { eventDate: "asc" },
  });
}

export async function updateEventStatus(id: string, status: EventStatus) {
  const session = await checkPermission("events:manage");

  const oldValues = await db.event.findUnique({ where: { id } });
  
  const event = await db.event.update({
    where: { id },
    data: { status },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "events",
    recordId: event.id,
    recordTable: "events",
    oldValues,
    newValues: event,
  });

  // If completing or cancelling, we don't auto-return items — that's a separate step
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function deallocateItem(eventId: string, itemId: string) {
  const session = await checkPermission("events:manage");

  const eventItem = await db.eventItem.findUnique({
    where: { eventId_itemId: { eventId, itemId } },
    include: { event: true },
  });

  if (!eventItem) return;

  // Returning the item back to stock before deleting the record
  const targetLocationId = eventItem.event.locationId || "main-warehouse";
  
  await RentalEngine.returnItems({
    eventId,
    locationId: targetLocationId,
    returns: [
      {
        itemId: eventItem.itemId,
        quantity: eventItem.quantity,
        condition: "GOOD", // Assume good condition if merely deallocated before use
        notes: "Deallocated",
      }
    ],
    createdBy: session.user.id!,
  });

  await db.eventItem.delete({
    where: { eventId_itemId: { eventId, itemId } },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/inventory");
}

export async function returnAllItems(eventId: string, locationId?: string) {
  const session = await checkPermission("events:manage");

  const unreturnedItems = await db.eventItem.findMany({
    where: { eventId, returnedAt: null },
    include: { event: true },
  });

  if (unreturnedItems.length === 0) return;

  const targetLocationId = locationId || "main-warehouse";

  await RentalEngine.returnItems({
    eventId,
    locationId: targetLocationId,
    returns: unreturnedItems.map(item => ({
      itemId: item.itemId,
      quantity: item.quantity,
      condition: "GOOD",
    })),
    createdBy: session.user.id!,
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/inventory");
}

export async function reconcileDamages(input: unknown) {
  const session = await checkPermission("events:manage");

  const parsed = reconcileDamagesSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
  }
  const { eventId, items } = parsed.data;

  const result = await db.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("Event not found");

    const existingDamageQuote = await tx.quote.findFirst({
      where: { eventId, type: QuoteType.DAMAGE },
    });
    if (existingDamageQuote) throw new Error("Already reconciled");

    const total = items.reduce((sum, item) => sum + item.amount, 0);

    const quote = await tx.quote.create({
      data: {
        eventId,
        type: QuoteType.DAMAGE,
        status: QuoteStatus.DRAFT,
        subtotal: total,
        total,
        amountPaid: 0,
        paymentStatus: PaymentStatus.outstanding,
      },
    });

    for (const item of items) {
      await tx.quoteLine.create({
        data: {
          quoteId: quote.id,
          quantity: 1,
          description: `${item.itemName} — ${item.condition}`,
          unitPrice: item.amount,
          lineTotal: item.amount,
        },
      });
    }

    const damageCategory = await tx.expenseCategory.findUnique({
      where: { name: "Damage & Loss" },
    });
    if (!damageCategory) {
      throw new Error(
        'Expense category "Damage & Loss" not found. Run: npx tsx prisma/seed.ts'
      );
    }

    for (const item of items) {
      await tx.expense.create({
        data: {
          categoryId: damageCategory.id,
          amount: item.amount,
          expenseDate: new Date(),
          description: `Write-off: ${item.itemName} (${item.condition}) — Event ${eventId}`,
          createdBy: session.user.id,
        },
      });
    }

    return quote;
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "finance",
    recordId: result.id,
    recordTable: "quotes",
    newValues: { type: "DAMAGE", eventId, itemCount: items.length },
  });

  revalidatePath(`/events/${eventId}`);
  revalidatePath("/finance");
  revalidatePath("/finance/pnl");
  revalidatePath("/finance/expenses");

  return result;
}

export async function getAvailableItemsAction(
  eventDate: string,
  eventId: string,
  locationId?: string
) {
  await checkPermission("events:manage");

  const items = await getAvailableItems(
    new Date(eventDate),
    undefined,
    eventId,
    locationId || undefined
  );

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    tag: item.tag,
    rentalPrice: Number(item.rentalPrice),
    category: item.category
      ? { id: item.category.id, name: item.category.name }
      : null,
  }));
}
