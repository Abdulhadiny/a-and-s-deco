"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export async function getCustomers(search?: string) {
  return db.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: { _count: { select: { events: true } } },
    orderBy: { name: "asc" },
  });
}

export async function getCustomer(id: string) {
  return db.customer.findUnique({
    where: { id },
    include: {
      events: {
        include: { _count: { select: { eventItems: true } } },
        orderBy: { eventDate: "desc" },
      },
    },
  });
}

export async function createCustomer(formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const notes = formData.get("notes") as string | null;

  if (!name?.trim()) throw new Error("Customer name is required");

  const customer = await db.customer.create({
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  revalidatePath("/customers");
  return customer;
}

export async function updateCustomer(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const phone = formData.get("phone") as string | null;
  const email = formData.get("email") as string | null;
  const address = formData.get("address") as string | null;
  const notes = formData.get("notes") as string | null;

  await db.customer.update({
    where: { id },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      address: address?.trim() || null,
      notes: notes?.trim() || null,
    },
  });
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
}
