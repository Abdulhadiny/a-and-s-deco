"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma";
import { categorySchema, itemSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { InventoryEngine } from "@/lib/engines/inventory-engine";

/**
 * Creates a new item category.
 */
export async function createCategory(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = categorySchema.parse(data);

  const category = await db.itemCategory.create({
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "inventory",
    recordId: category.id,
    recordTable: "item_categories",
    newValues: category,
  });

  revalidatePath("/settings/products");
  return category;
}

/**
 * Updates an item category.
 */
export async function updateCategory(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = categorySchema.parse(data);

  const oldValues = await db.itemCategory.findUnique({ where: { id } });

  const category = await db.itemCategory.update({
    where: { id },
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "inventory",
    recordId: category.id,
    recordTable: "item_categories",
    oldValues,
    newValues: category,
  });

  revalidatePath("/settings/products");
  return category;
}

/**
 * Creates a new item and optionally initializes its stock.
 */
export async function createItem(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = itemSchema.parse(data);
  const initialQuantity = parseInt(data.initialQuantity || "0", 10);
  const locationId = data.locationId || "main-warehouse";

  const result = await db.$transaction(async (tx) => {
    const item = await tx.item.create({
      data: {
        ...validated,
        rentalPrice: validated.rentalPrice,
      },
    });

    if (initialQuantity > 0) {
      await InventoryEngine.credit({
        storeCode: "MAIN",
        itemId: item.id,
        quantity: initialQuantity,
        locationId,
        referenceType: "INITIAL_STOCK",
        referenceId: item.id,
        createdBy: session.user.id!,
        notes: "Initial stock entry",
        tx,
      });
    }

    await logAction({
      userId: session.user.id!,
      action: AuditAction.create,
      module: "inventory",
      recordId: item.id,
      recordTable: "items",
      newValues: item,
    });

    return item;
  });

  revalidatePath("/inventory");
  revalidatePath("/settings/products");
  return result;
}

/**
 * Fetches all inventory items with optional filters.
 */
export async function getItems(filters: { search?: string; categoryId?: string; status?: string } = {}) {
  const { search, categoryId, status } = filters;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { tag: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (categoryId && categoryId !== "all") {
    where.categoryId = categoryId;
  }
  
  if (status && status !== "all") {
    where.status = status;
  }

  return await db.item.findMany({
    where,
    include: { 
      category: true, 
      stock: true,
      eventItems: {
        include: { event: { include: { customer: true } } }
      }
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Fetches a single inventory item by ID.
 */
export async function getItem(id: string) {
  return await db.item.findUnique({
    where: { id },
    include: { 
      category: true, 
      stock: true,
      eventItems: {
        include: { event: { include: { customer: true } } }
      }
    },
  });
}

/**
 * Fetches all item categories.
 */
export async function getCategories() {
  return await db.itemCategory.findMany({
    orderBy: { name: "asc" },
  });
}

/**
 * Fetches inventory statistics.
 */
export async function getInventoryStats() {
  const [total, available, damaged, retired, out, categories] = await Promise.all([
    db.item.count(),
    db.item.count({ where: { status: "AVAILABLE" } }),
    db.item.count({ where: { status: "DAMAGED" } }),
    db.item.count({ where: { status: "RETIRED" } }),
    db.eventItem.count({ where: { returnedAt: null } }),
    db.itemCategory.count(),
  ]);

  return {
    total,
    available,
    damaged,
    retired,
    out,
    categories,
  };
}

/**
 * Updates an inventory item.
 */
export async function updateItem(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = itemSchema.parse(data);

  const oldValues = await db.item.findUnique({ where: { id } });

  const item = await db.item.update({
    where: { id },
    data: {
      ...validated,
      rentalPrice: validated.rentalPrice,
    },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "inventory",
    recordId: item.id,
    recordTable: "items",
    oldValues,
    newValues: item,
  });

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  revalidatePath("/settings/products");
  return item;
}

/**
 * Bulk create items and initialize their stock.
 */
export async function bulkCreateItems(items: any[]) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  return await db.$transaction(async (tx) => {
    let count = 0;
    for (const itemData of items) {
      const { initialQuantity, locationId, ...rest } = itemData;
      const validated = itemSchema.parse(rest);

      const item = await tx.item.create({
        data: {
          ...validated,
          rentalPrice: validated.rentalPrice,
        },
      });

      if (initialQuantity && initialQuantity > 0) {
        await InventoryEngine.credit({
          storeCode: "MAIN",
          itemId: item.id,
          quantity: initialQuantity,
          locationId: locationId || "main-warehouse",
          referenceType: "INITIAL_STOCK",
          referenceId: item.id,
          createdBy: session.user.id!,
          notes: "Initial stock entry from bulk add",
          tx,
        });
      }

      await logAction({
        userId: session.user.id!,
        action: AuditAction.create,
        module: "inventory",
        recordId: item.id,
        recordTable: "items",
        newValues: item,
      });

      count++;
    }

    return { count };
  });
}

