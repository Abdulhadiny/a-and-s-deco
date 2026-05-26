"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { EventStatus } from "@/generated/prisma";
import { checkItemsAvailable } from "@/lib/availability";

export async function getEvents(filters?: {
  status?: EventStatus;
  month?: number;
  year?: number;
}) {
  const where: Record<string, unknown> = {};
  if (filters?.status) where.status = filters.status;
  if (filters?.month !== undefined && filters?.year !== undefined) {
    const start = new Date(filters.year, filters.month, 1);
    const end = new Date(filters.year, filters.month + 1, 0);
    where.eventDate = { gte: start, lte: end };
  }

  return db.event.findMany({
    where,
    include: {
      customer: true,
      _count: { select: { eventItems: true } },
    },
    orderBy: { eventDate: "asc" },
  });
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
      eventType: eventType as EventStatus extends never ? never : typeof eventType extends string ? any : never,
      eventDate: new Date(eventDate),
      setupDate: setupDate ? new Date(setupDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      venue: venue?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  revalidatePath("/events");
  return event;
}

export async function updateEvent(id: string, formData: FormData) {
  const customerId = formData.get("customerId") as string;
  const title = formData.get("title") as string;
  const eventType = formData.get("eventType") as string;
  const eventDate = formData.get("eventDate") as string;
  const setupDate = formData.get("setupDate") as string | null;
  const returnDate = formData.get("returnDate") as string | null;
  const venue = formData.get("venue") as string | null;
  const notes = formData.get("notes") as string | null;
  const status = formData.get("status") as EventStatus | null;

  await db.event.update({
    where: { id },
    data: {
      customerId,
      title: title.trim(),
      eventType: eventType as any,
      eventDate: new Date(eventDate),
      setupDate: setupDate ? new Date(setupDate) : null,
      returnDate: returnDate ? new Date(returnDate) : null,
      venue: venue?.trim() || null,
      notes: notes?.trim() || null,
      ...(status ? { status } : {}),
    },
  });
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function updateEventStatus(id: string, status: EventStatus) {
  await db.event.update({
    where: { id },
    data: { status },
  });

  // If completing or cancelling, we don't auto-return items — that's a separate step
  revalidatePath("/events");
  revalidatePath(`/events/${id}`);
}

export async function allocateItems(eventId: string, itemIds: string[]) {
  const event = await db.event.findUnique({ where: { id: eventId } });
  if (!event) throw new Error("Event not found");

  // Check availability
  const { available, conflictingItems } = await checkItemsAvailable(
    itemIds,
    event.eventDate,
    eventId
  );

  if (!available) {
    throw new Error(
      `Items not available: ${conflictingItems.join(", ")}`
    );
  }

  await db.eventItem.createMany({
    data: itemIds.map((itemId) => ({
      eventId,
      itemId,
    })),
    skipDuplicates: true,
  });

  revalidatePath(`/events/${eventId}`);
}

export async function deallocateItem(eventId: string, itemId: string) {
  await db.eventItem.delete({
    where: { eventId_itemId: { eventId, itemId } },
  });
  revalidatePath(`/events/${eventId}`);
}

export async function returnItem(
  eventItemId: string,
  condition: "GOOD" | "DAMAGED" | "MISSING",
  damageNotes?: string,
  damagePhotoUrl?: string
) {
  const eventItem = await db.eventItem.update({
    where: { id: eventItemId },
    data: {
      returnedAt: new Date(),
      returnCondition: condition,
      damageNotes: damageNotes?.trim() || null,
      damagePhotoUrl: damagePhotoUrl || null,
    },
    include: { event: true },
  });

  // Update item status if damaged or missing
  if (condition === "DAMAGED") {
    await db.item.update({
      where: { id: eventItem.itemId },
      data: {
        status: "DAMAGED",
        conditionNotes: damageNotes?.trim() || "Damaged on return",
      },
    });
  }

  revalidatePath(`/events/${eventItem.eventId}`);
  revalidatePath("/inventory");
}

export async function returnAllItems(eventId: string) {
  await db.eventItem.updateMany({
    where: { eventId, returnedAt: null },
    data: {
      returnedAt: new Date(),
      returnCondition: "GOOD",
    },
  });
  revalidatePath(`/events/${eventId}`);
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
