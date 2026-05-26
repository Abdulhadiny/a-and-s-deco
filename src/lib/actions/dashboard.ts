"use server";

import { db } from "@/lib/db";

export async function getDashboardData() {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const [
    thisWeekEvents,
    monthEventCount,
    itemsOut,
    damagedItems,
    totalItems,
    availableItems,
    upcomingEvents,
    totalCustomers,
  ] = await Promise.all([
    db.event.findMany({
      where: {
        eventDate: { gte: startOfWeek, lte: endOfWeek },
        status: { in: ["UPCOMING", "IN_PROGRESS"] },
      },
      include: { customer: true, _count: { select: { eventItems: true } } },
      orderBy: { eventDate: "asc" },
    }),
    db.event.count({
      where: {
        eventDate: { gte: startOfMonth, lte: endOfMonth },
      },
    }),
    db.eventItem.findMany({
      where: {
        returnedAt: null,
        event: { status: { in: ["UPCOMING", "IN_PROGRESS"] } },
      },
      include: {
        item: { include: { category: true } },
        event: { select: { title: true, eventDate: true } },
      },
    }),
    db.item.findMany({
      where: { status: "DAMAGED" },
      include: { category: true },
      take: 10,
    }),
    db.item.count({ where: { status: { not: "RETIRED" } } }),
    db.item.count({ where: { status: "AVAILABLE" } }),
    db.event.count({
      where: { status: "UPCOMING" },
    }),
    db.customer.count(),
  ]);

  return {
    thisWeekEvents,
    monthEventCount,
    itemsOut,
    damagedItems,
    totalItems,
    availableItems,
    upcomingEvents,
    totalCustomers,
  };
}
