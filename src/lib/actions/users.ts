"use server";

import { db } from "@/lib/db";
import { checkPermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction, Prisma } from "@/generated/prisma";
import { userSchema, profileSchema } from "@/lib/validators";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Updates the current user's own profile (name and/or password).
 */
export async function updateProfile(data: unknown) {
  const session = await checkPermission("inventory:read"); // any authenticated user

  const validated = profileSchema.parse(data);

  const user = await db.user.findUnique({ where: { id: session.user.id! } });
  if (!user) throw new Error("User not found");

  const passwordValid = await bcrypt.compare(validated.currentPassword, user.passwordHash);
  if (!passwordValid) throw new Error("Current password is incorrect");

  const updateData: Prisma.UserUncheckedUpdateInput = {
    name: validated.name,
  };

  if (validated.newPassword) {
    updateData.passwordHash = await bcrypt.hash(validated.newPassword, 12);
  }

  const updated = await db.user.update({
    where: { id: session.user.id! },
    data: updateData,
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "users",
    recordId: updated.id,
    recordTable: "users",
    newValues: { name: updated.name, passwordChanged: !!validated.newPassword },
  });

  revalidatePath("/settings/profile");
}

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

