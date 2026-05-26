"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { ItemStatus } from "@/generated/prisma";

export async function getCategories() {
  return db.itemCategory.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { items: true } } },
  });
}

export async function createCategory(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string | null;
  if (!name?.trim()) throw new Error("Category name is required");

  await db.itemCategory.create({
    data: { name: name.trim(), description: description?.trim() || null },
  });
  revalidatePath("/inventory");
}

export async function getItems(filters?: {
  categoryId?: string;
  status?: ItemStatus;
  search?: string;
}) {
  return db.item.findMany({
    where: {
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search
        ? {
            OR: [
              { name: { contains: filters.search, mode: "insensitive" } },
              { tag: { contains: filters.search, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    include: { category: true },
    orderBy: [{ category: { name: "asc" } }, { tag: "asc" }],
  });
}

export async function getItem(id: string) {
  return db.item.findUnique({
    where: { id },
    include: {
      category: true,
      eventItems: {
        include: { event: { include: { customer: true } } },
        orderBy: { allocatedAt: "desc" },
        take: 10,
      },
    },
  });
}

export async function createItem(formData: FormData) {
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const tag = formData.get("tag") as string;
  const rentalPrice = formData.get("rentalPrice") as string;
  const description = formData.get("description") as string | null;
  const imageUrl = formData.get("imageUrl") as string | null;

  if (!categoryId || !name?.trim() || !tag?.trim() || !rentalPrice) {
    throw new Error("Missing required fields");
  }

  await db.item.create({
    data: {
      categoryId,
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      rentalPrice: parseFloat(rentalPrice),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
    },
  });
  revalidatePath("/inventory");
}

export async function updateItem(id: string, formData: FormData) {
  const categoryId = formData.get("categoryId") as string;
  const name = formData.get("name") as string;
  const tag = formData.get("tag") as string;
  const rentalPrice = formData.get("rentalPrice") as string;
  const description = formData.get("description") as string | null;
  const imageUrl = formData.get("imageUrl") as string | null;
  const status = formData.get("status") as ItemStatus;
  const conditionNotes = formData.get("conditionNotes") as string | null;

  await db.item.update({
    where: { id },
    data: {
      categoryId,
      name: name.trim(),
      tag: tag.trim().toUpperCase(),
      rentalPrice: parseFloat(rentalPrice),
      description: description?.trim() || null,
      imageUrl: imageUrl?.trim() || null,
      status,
      conditionNotes: conditionNotes?.trim() || null,
    },
  });
  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
}

export async function bulkCreateItems(
  items: {
    categoryId: string;
    name: string;
    tag: string;
    rentalPrice: number;
    description?: string;
  }[]
) {
  await db.item.createMany({
    data: items.map((item) => ({
      categoryId: item.categoryId,
      name: item.name.trim(),
      tag: item.tag.trim().toUpperCase(),
      rentalPrice: item.rentalPrice,
      description: item.description?.trim() || null,
    })),
  });
  revalidatePath("/inventory");
}

export async function getInventoryStats() {
  const [total, available, damaged, retired] = await Promise.all([
    db.item.count(),
    db.item.count({ where: { status: "AVAILABLE" } }),
    db.item.count({ where: { status: "DAMAGED" } }),
    db.item.count({ where: { status: "RETIRED" } }),
  ]);

  // Items currently out (allocated to UPCOMING/IN_PROGRESS events, not returned)
  const outItems = await db.eventItem.count({
    where: {
      returnedAt: null,
      event: { status: { in: ["UPCOMING", "IN_PROGRESS"] } },
    },
  });

  return { total, available, damaged, retired, out: outItems };
}
