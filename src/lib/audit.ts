import { db } from "./db";
import { AuditAction } from "@/generated/prisma";

/**
 * Logs an action to the audit_logs table.
 */
export async function logAction({
  userId,
  action,
  module,
  recordId,
  recordTable,
  oldValues = null,
  newValues = null,
  ipAddress = null,
}: {
  userId: string | null;
  action: AuditAction;
  module: string;
  recordId: string;
  recordTable: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
}) {
  try {
    await db.auditLog.create({
      data: {
        userId,
        action,
        module,
        recordId,
        recordTable,
        oldValues: oldValues ? JSON.parse(JSON.stringify(oldValues)) : null,
        newValues: newValues ? JSON.parse(JSON.stringify(newValues)) : null,
        ipAddress,
      },
    });
  } catch (error) {
    // We don't want audit logging to crash the main transaction
    console.error("Audit Log Failure Details:", {
      error,
      userId,
      action,
      module,
      recordId,
      recordTable
    });
  }
}
