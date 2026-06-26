import { db } from "./db";
import { AuditAction } from "@/generated/prisma";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

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
  tx,
}: {
  userId: string | null;
  action: AuditAction;
  module: string;
  recordId: string;
  recordTable: string;
  oldValues?: unknown;
  newValues?: unknown;
  ipAddress?: string | null;
  tx?: TxClient;
}) {
  try {
    const client = tx || db;
    await client.auditLog.create({
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
