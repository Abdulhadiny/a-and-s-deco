"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function getNotifications() {
  const session = await requireSession();

  const [notifications, unreadCount] = await db.$transaction([
    db.notification.findMany({
      where: { userId: session.user.id! },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    db.notification.count({
      where: { userId: session.user.id!, isRead: false },
    }),
  ]);

  return { notifications, unreadCount };
}

export async function markAsRead(id: string) {
  const session = await requireSession();

  await db.notification.updateMany({
    where: { id, userId: session.user.id! },
    data: { isRead: true },
  });
}

export async function markAllAsRead() {
  const session = await requireSession();

  await db.notification.updateMany({
    where: { userId: session.user.id!, isRead: false },
    data: { isRead: true },
  });
}
