"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma";
import { locationSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";

/**
 * Creates a new location.
 */
export async function createLocation(data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = locationSchema.parse(data);

  const location = await db.location.create({
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "settings",
    recordId: location.id,
    recordTable: "locations",
    newValues: location,
  });

  revalidatePath("/settings/locations");
  return location;
}

/**
 * Updates an existing location.
 */
export async function updateLocation(id: string, data: any) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const validated = locationSchema.parse(data);

  const oldValues = await db.location.findUnique({ where: { id } });

  const location = await db.location.update({
    where: { id },
    data: validated,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "settings",
    recordId: location.id,
    recordTable: "locations",
    oldValues,
    newValues: location,
  });

  revalidatePath("/settings/locations");
  return location;
}

/**
 * Deactivates a location.
 */
export async function deleteLocation(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const oldValues = await db.location.findUnique({ where: { id } });

  const location = await db.location.update({
    where: { id },
    data: { isActive: false },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.delete,
    module: "settings",
    recordId: id,
    recordTable: "locations",
    oldValues,
    newValues: location,
  });

  revalidatePath("/settings/locations");
  return location;
}
