import { db } from "../db";
import { InventoryEngine, TxClient } from "./inventory-engine";
import { ReturnCondition, EventStatus, AuditAction } from "@/generated/prisma";
import { logAction } from "../audit";

interface AllocationItem {
  itemId: string;
  quantity: number;
}

/**
 * The Rental Engine manages the lifecycle of items assigned to events.
 * It ensures atomic updates between Event records and Inventory stock.
 */
export const RentalEngine = {
  /**
   * Allocates items to an event.
   * Decrements stock from MAIN store at the specified location.
   */
  async allocateItems({
    eventId,
    locationId,
    items,
    createdBy,
  }: {
    eventId: string;
    locationId: string;
    items: AllocationItem[];
    createdBy: string;
  }) {
    return await db.$transaction(async (tx) => {
      for (const item of items) {
        // 1. Decrement MAIN stock
        await InventoryEngine.debit({
          storeCode: "MAIN",
          itemId: item.itemId,
          quantity: item.quantity,
          locationId,
          referenceType: "EVENT_ALLOCATION",
          referenceId: eventId,
          createdBy,
          tx,
        });

        // 2. Create or Update EventItem record
        const existing = await tx.eventItem.findUnique({
          where: { eventId_itemId: { eventId, itemId: item.itemId } }
        });

        if (existing) {
          await tx.eventItem.update({
            where: { id: existing.id },
            data: { quantity: { increment: item.quantity } }
          });
        } else {
          await tx.eventItem.create({
            data: {
              eventId,
              itemId: item.itemId,
              quantity: item.quantity,
            }
          });
        }
      }

      // 3. Update event status if it was UPCOMING
      const event = await tx.event.findUnique({ where: { id: eventId } });
      if (event?.status === EventStatus.UPCOMING) {
        const updatedEvent = await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.IN_PROGRESS }
        });

        await logAction({
          userId: createdBy,
          action: AuditAction.update,
          module: "events",
          recordId: eventId,
          recordTable: "events",
          newValues: updatedEvent,
          ipAddress: "system",
        });
      }

      return { success: true };
    });
  },

  /**
   * Processes the return of items from an event.
   * Increments stock in the appropriate store (MAIN, DAMAGED, LOST).
   */
  async returnItems({
    eventId,
    locationId,
    returns,
    createdBy,
  }: {
    eventId: string;
    locationId: string;
    returns: {
      itemId: string;
      quantity: number;
      condition: ReturnCondition;
      notes?: string;
    }[];
    createdBy: string;
  }) {
    return await db.$transaction(async (tx) => {
      for (const ret of returns) {
        // 1. Determine which store to credit
        let storeCode = "MAIN";
        if (ret.condition === ReturnCondition.DAMAGED) storeCode = "DAMAGED";
        if (ret.condition === ReturnCondition.MISSING) storeCode = "LOST";

        // 2. Credit the stock
        await InventoryEngine.credit({
          storeCode,
          itemId: ret.itemId,
          quantity: ret.quantity,
          locationId,
          referenceType: "EVENT_RETURN",
          referenceId: eventId,
          createdBy,
          notes: ret.notes,
          tx,
        });

        // 3. Update EventItem record
        await tx.eventItem.update({
          where: { eventId_itemId: { eventId, itemId: ret.itemId } },
          data: {
            returnedAt: new Date(),
            returnCondition: ret.condition,
            damageNotes: ret.notes,
          }
        });
      }

      // Check if all items for this event are returned to potentially auto-close the event
      const remainingItems = await tx.eventItem.count({
        where: { eventId, returnedAt: null }
      });

      if (remainingItems === 0) {
        const closedEvent = await tx.event.update({
          where: { id: eventId },
          data: { status: EventStatus.COMPLETED }
        });

        await logAction({
          userId: createdBy,
          action: AuditAction.update,
          module: "events",
          recordId: eventId,
          recordTable: "events",
          newValues: closedEvent,
          ipAddress: "system",
        });
      }

      return { success: true };
    });
  }
};
