"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { logAction } from "@/lib/audit";
import { AuditAction } from "@/generated/prisma";
import { revalidatePath } from "next/cache";

/**
 * Updates a system configuration setting.
 */
export async function updateSystemConfig(key: string, value: any, description?: string) {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");

  const oldValues = await db.systemConfig.findUnique({ where: { key } });

  const config = await db.systemConfig.upsert({
    where: { key },
    update: { 
      value: value,
      description,
      updatedBy: session.user.id,
    },
    create: {
      key,
      value: value,
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
