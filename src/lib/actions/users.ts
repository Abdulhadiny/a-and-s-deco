"use server";

import { db } from "@/lib/db";
import { checkPermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction, Prisma } from "@/generated/prisma";
import { userSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Creates a new user.
 */
export async function createUser(data: unknown) {
  const session = await checkPermission("users:manage");

  const validated = userSchema.parse(data);

  if (!validated.password) {
    throw new Error("Password is required for new users");
  }

  const passwordHash = await bcrypt.hash(validated.password, 12);

  const user = await db.user.create({
    data: {
      email: validated.email,
      name: validated.name,
      passwordHash,
      roleId: validated.roleId,
      locationId: validated.locationId,
      isActive: validated.isActive,
    },
    include: { role: true },
  });

  const userWithoutPassword = { ...user } as Record<string, unknown>;
  delete userWithoutPassword.passwordHash;

  await logAction({
    userId: session.user.id!,
    action: AuditAction.create,
    module: "users",
    recordId: user.id,
    recordTable: "users",
    newValues: userWithoutPassword,
  });

  revalidatePath("/settings/users");
  return userWithoutPassword;
}

/**
 * Updates an existing user.
 */
export async function updateUser(id: string, data: unknown) {
  const session = await checkPermission("users:manage");

  const validated = userSchema.parse(data);

  const oldUser = await db.user.findUnique({ where: { id } });
  if (!oldUser) throw new Error("User not found");

  const updateData: Prisma.UserUncheckedUpdateInput = {
    email: validated.email,
    name: validated.name,
    roleId: validated.roleId,
    locationId: validated.locationId,
    isActive: validated.isActive,
  };

  if (validated.password) {
    updateData.passwordHash = await bcrypt.hash(validated.password, 12);
  }

  const user = await db.user.update({
    where: { id },
    data: updateData,
    include: { role: true },
  });

  const userWithoutPassword = { ...user } as Record<string, unknown>;
  delete userWithoutPassword.passwordHash;

  const oldUserWithoutPassword = { ...oldUser } as Record<string, unknown>;
  delete oldUserWithoutPassword.passwordHash;

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "users",
    recordId: user.id,
    recordTable: "users",
    oldValues: oldUserWithoutPassword,
    newValues: userWithoutPassword,
  });

  revalidatePath("/settings/users");
  return userWithoutPassword;
}

