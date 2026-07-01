import { db } from "./db";
import { NotificationType } from "@/generated/prisma";

type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

interface NotificationPayload {
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}

async function sendNotification(
  userIds: string[],
  payload: NotificationPayload,
  tx?: TxClient
): Promise<void> {
  if (userIds.length === 0) return;
  const client = tx || db;
  await (client as typeof db).notification.createMany({
    data: userIds.map((userId) => ({
      userId,
      title: payload.title,
      message: payload.message,
      type: payload.type,
      link: payload.link ?? null,
    })),
  });
}

async function dispatchPush(
  userIds: string[],
  title: string,
  message: string,
  url?: string
): Promise<void> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey || userIds.length === 0) return;

  await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      app_id: appId,
      include_aliases: { external_id: userIds },
      target_channel: "push",
      headings: { en: title },
      contents: { en: message },
      ...(url && { url }),
    }),
  });
}

/**
 * Sends a notification to all active users. Non-blocking — errors are swallowed.
 */
export async function notifyAll(
  payload: NotificationPayload,
  tx?: TxClient
): Promise<void> {
  try {
    const users = await db.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await sendNotification(userIds, payload, tx);
    dispatchPush(userIds, payload.title, payload.message, payload.link).catch(() => {});
  } catch (error) {
    console.error("[notifications] dispatch failed:", {
      type: payload.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Sends a notification to active users assigned to a specific warehouse location.
 * Non-blocking — errors are swallowed.
 */
export async function notifyByLocation(
  locationId: string,
  payload: NotificationPayload,
  tx?: TxClient
): Promise<void> {
  try {
    const users = await db.user.findMany({
      where: { locationId, isActive: true },
      select: { id: true },
    });
    const userIds = users.map((u) => u.id);
    await sendNotification(userIds, payload, tx);
    dispatchPush(userIds, payload.title, payload.message, payload.link).catch(() => {});
  } catch (error) {
    console.error("[notifications] dispatch failed:", {
      type: payload.type,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
