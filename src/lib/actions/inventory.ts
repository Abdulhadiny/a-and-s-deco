"use server";

import { db } from "@/lib/db";
import { checkPermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction, ItemStatus, Prisma } from "@/generated/prisma";
import { categorySchema, itemSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import { InventoryEngine } from "@/lib/engines/inventory-engine";

const UNIQUE_FIELD_LABELS: Record<string, string> = {
  tag: "Tag",
  name: "Name",
};

function handlePrismaError(err: unknown): never {
  const e = err as { code?: string; message?: string; meta?: { target?: string[] } };
  if (e.code === "P2002") {
    // meta.target exists in standard Prisma, but @prisma/adapter-pg omits it.
    // Fall back to parsing the field from the error message.
    const field =
      e.meta?.target?.[0] ??
      e.message?.match(/fields: \(`(.+?)`\)/)?.[1];
    const label = (field && UNIQUE_FIELD_LABELS[field]) || field || "value";
    throw new Error(
      `An item with this ${label} already exists. Please use a different ${label.toLowerCase()}.`
    );
  }
  throw err;
}

/**
 * Creates a new item category.
 */
export async function createCategory(data: unknown) {
  const session = await checkPermission("inventory:manage");

  const validated = categorySchema.parse(data);

  let category;
  try {
    category = await db.itemCategory.create({
      data: validated,
    });
  } catch (err) {
    const e = err as { code?: string };
    if (e.code === "P2002") {
      throw new Error("A category with this name already exists.");
    }
    throw err;
  }

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
export async function updateCategory(id: string, data: unknown) {
  const session = await checkPermission("inventory:manage");

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
export async function createItem(data: unknown) {
  const session = await checkPermission("inventory:manage");

  const validated = itemSchema.parse(data);
  const rawData = data as Record<string, unknown>;
  const initialQuantity = parseInt(String(rawData.initialQuantity || "0"), 10);
  const locationId = String(rawData.locationId || "main-warehouse");

  let result;
  try {
    result = await db.$transaction(async (tx) => {
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
  } catch (err) {
    handlePrismaError(err);
  }

  revalidatePath("/inventory");
  revalidatePath("/settings/products");
  return result;
}

/**
 * Fetches all inventory items with optional filters.
 */
export async function getItems(filters: { search?: string; categoryId?: string; status?: string } = {}) {
  const { search, categoryId, status } = filters;
  
  const where: Prisma.ItemWhereInput = {};
  
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
    where.status = status as ItemStatus;
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
export async function updateItem(id: string, data: unknown) {
  const session = await checkPermission("inventory:manage");

  const validated = itemSchema.parse(data);

  const oldValues = await db.item.findUnique({ where: { id } });

  let item;
  try {
    item = await db.item.update({
      where: { id },
      data: {
        ...validated,
        rentalPrice: validated.rentalPrice,
      },
    });
  } catch (err) {
    handlePrismaError(err);
  }

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
export async function bulkCreateItems(items: unknown[]) {
  const session = await checkPermission("inventory:manage");

  try {
    return await db.$transaction(async (tx) => {
      let count = 0;
      for (const rawItem of items) {
        const itemData = rawItem as { initialQuantity?: number; locationId?: string; [key: string]: unknown };
        const { initialQuantity, locationId, ...rest } = itemData;
        const validated = itemSchema.parse(rest);

        const item = await tx.item.create({
          data: {
            ...validated,
            rentalPrice: validated.rentalPrice,
          },
        });

        if (initialQuantity !== undefined && initialQuantity > 0) {
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
  } catch (err) {
    handlePrismaError(err);
  }
}

