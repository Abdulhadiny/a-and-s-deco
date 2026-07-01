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
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const [
    thisWeekEvents,
    monthEventCount,
    itemsOut,
    totalItems,
    availableItems,
    upcomingEvents,
    revenueMTD,
    outstandingAggregate,
    topOutstandingQuotes,
    todayEvents,
    damageAwaiting,
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
        event: { select: { title: true, eventDate: true, returnDate: true } },
      },
      take: 15,
    }),
    db.item.count({ where: { status: { not: "RETIRED" } } }),
    db.item.count({ where: { status: "AVAILABLE" } }),
    db.event.count({ where: { status: "UPCOMING" } }),
    db.customerPayment.aggregate({
      where: { paymentDate: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    db.quote.aggregate({
      where: { paymentStatus: { in: ["outstanding", "partial"] } },
      _sum: { total: true, amountPaid: true },
    }),
    db.quote.findMany({
      where: { paymentStatus: { in: ["outstanding", "partial"] } },
      include: { event: { include: { customer: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.event.findMany({
      where: {
        status: { in: ["UPCOMING", "IN_PROGRESS"] },
        OR: [
          { eventDate: { gte: startOfToday, lte: endOfToday } },
          { setupDate: { gte: startOfToday, lte: endOfToday } },
          { returnDate: { gte: startOfToday, lte: endOfToday } },
        ],
      },
      include: { customer: true, _count: { select: { eventItems: true } } },
      orderBy: { eventDate: "asc" },
    }),
    db.eventItem.findMany({
      where: {
        returnedAt: { not: null },
        returnCondition: { in: ["DAMAGED", "MISSING"] },
        event: {
          status: "COMPLETED",
          quotes: { none: { type: "DAMAGE" } },
        },
      },
      include: {
        item: true,
        event: { include: { customer: true } },
      },
      take: 10,
    }),
  ]);

  return {
    thisWeekEvents,
    monthEventCount,
    itemsOut,
    totalItems,
    availableItems,
    upcomingEvents,
    revenueMTD: revenueMTD._sum.amount,
    outstandingBalance: {
      total: outstandingAggregate._sum.total,
      amountPaid: outstandingAggregate._sum.amountPaid,
    },
    topOutstandingQuotes,
    todayEvents,
    damageAwaiting,
  };
}
