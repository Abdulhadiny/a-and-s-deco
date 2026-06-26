"use server";

import { db } from "@/lib/db";
import { checkPermission } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction, Prisma } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

/**
 * Updates a system configuration setting.
 */
export async function updateSystemConfig(key: string, value: unknown, description?: string) {
  const session = await checkPermission("settings:manage");

  const oldValues = await db.systemConfig.findUnique({ where: { key } });

  const config = await db.systemConfig.upsert({
    where: { key },
    update: { 
      value: value as Prisma.InputJsonValue,
      description,
      updatedBy: session.user.id,
    },
    create: {
      key,
      value: value as Prisma.InputJsonValue,
      description,
      updatedBy: session.user.id,
    },
  });

  await logAction({
    userId: session.user.id!,
    action: AuditAction.update,
    module: "settings",
    recordId: config.id,
    recordTable: "system_configs",
    oldValues,
    newValues: config,
  });

  revalidatePath("/settings/configuration");
  return config;
}
