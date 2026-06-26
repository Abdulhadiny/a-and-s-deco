import { db } from "@/lib/db";

/**
 * Get items available on a specific date at a specific location
 * (checks if the item has currentQty > 0 in the MAIN store at the target location).
 */
export async function getAvailableItems(
  targetDate: Date,
  categoryId?: string,
  excludeEventId?: string,
  locationId?: string
) {
  const targetLocation = locationId || "main-warehouse";

  // Fetch items and check their stock records at the target location
  const items = await db.item.findMany({
    where: {
      status: "AVAILABLE",
      ...(categoryId ? { categoryId } : {}),
    },
    include: {
      category: true,
      stock: {
        where: {
          locationId: targetLocation,
          store: { storeCode: "MAIN" },
        },
      },
    },
    orderBy: [{ category: { name: "asc" } }, { tag: "asc" }],
  });

  // Filter items that have stock quantity > 0 at this location
  return items.filter((item) => {
    const mainStock = item.stock[0];
    return mainStock && mainStock.currentQty > 0;
  });
}

/**
 * Get availability summary per category for a date at a specific location.
 */
export async function getAvailabilitySummary(
  targetDate: Date, 
  excludeEventId?: string,
  locationId?: string
) {
  const targetLocation = locationId || "main-warehouse";
  const allItems = await db.item.findMany({
    where: { status: { not: "RETIRED" } },
    include: { category: true },
  });

  const availableItems = await getAvailableItems(targetDate, undefined, excludeEventId, targetLocation);
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
 * Check if specific items are available for a date at a location (used before allocation).
 */
export async function checkItemsAvailable(
  itemIds: string[],
  targetDate: Date,
  excludeEventId?: string,
  locationId?: string
): Promise<{ available: boolean; conflictingItems: string[] }> {
  const available = await getAvailableItems(targetDate, undefined, excludeEventId, locationId);
  const availableIds = new Set(available.map((i) => i.id));
  const conflicting = itemIds.filter((id) => !availableIds.has(id));
  return { available: conflicting.length === 0, conflictingItems: conflicting };
}
