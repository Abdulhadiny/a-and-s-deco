import { db } from "@/lib/db";
import { Prisma } from "@/generated/prisma";

/**
 * Get items available on a specific date (not allocated to any UPCOMING/IN_PROGRESS event
 * whose date range overlaps the target date).
 */
export async function getAvailableItems(
  targetDate: Date,
  categoryId?: string,
  excludeEventId?: string
) {
  const dateStr = targetDate.toISOString().split("T")[0];

  // Items that are committed on the target date
  const committedItemIds = await db.eventItem.findMany({
    where: {
      returnedAt: null,
      event: {
        status: { in: ["UPCOMING", "IN_PROGRESS"] },
        ...(excludeEventId ? { id: { not: excludeEventId } } : {}),
        // Event overlaps target date if:
        // setupDate (or eventDate) <= targetDate AND returnDate (or eventDate) >= targetDate
        AND: [
          {
            OR: [
              { setupDate: { lte: targetDate } },
              { AND: [{ setupDate: null }, { eventDate: { lte: targetDate } }] },
            ],
          },
          {
            OR: [
              { returnDate: { gte: targetDate } },
              { AND: [{ returnDate: null }, { eventDate: { gte: targetDate } }] },
            ],
          },
        ],
      },
    },
    select: { itemId: true },
  });

  const committedIds = committedItemIds.map((ei) => ei.itemId);

  return db.item.findMany({
    where: {
      status: "AVAILABLE",
      ...(categoryId ? { categoryId } : {}),
      ...(committedIds.length > 0 ? { id: { notIn: committedIds } } : {}),
    },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { tag: "asc" }],
  });
}

/**
 * Get availability summary per category for a date.
 */
export async function getAvailabilitySummary(targetDate: Date, excludeEventId?: string) {
  const allItems = await db.item.findMany({
    where: { status: { not: "RETIRED" } },
    include: { category: true },
  });

  const availableItems = await getAvailableItems(targetDate, undefined, excludeEventId);
  const availableIds = new Set(availableItems.map((i) => i.id));

  const categories = new Map<
    string,
    { name: string; total: number; available: number }
  >();

  for (const item of allItems) {
    const cat = categories.get(item.categoryId) ?? {
      name: item.category.name,
      total: 0,
      available: 0,
    };
    cat.total++;
    if (availableIds.has(item.id)) cat.available++;
    categories.set(item.categoryId, cat);
  }

  return Array.from(categories.entries()).map(([id, data]) => ({
    categoryId: id,
    ...data,
  }));
}

/**
 * Check if specific items are available for a date (used before allocation).
 */
export async function checkItemsAvailable(
  itemIds: string[],
  targetDate: Date,
  excludeEventId?: string
): Promise<{ available: boolean; conflictingItems: string[] }> {
  const available = await getAvailableItems(targetDate, undefined, excludeEventId);
  const availableIds = new Set(available.map((i) => i.id));
  const conflicting = itemIds.filter((id) => !availableIds.has(id));
  return { available: conflicting.length === 0, conflictingItems: conflicting };
}
