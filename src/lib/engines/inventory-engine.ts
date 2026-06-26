import { db } from "../db";
import { TransactionType, AuditAction } from "@/generated/prisma";
import { logAction } from "../audit";

/** Prisma interactive-transaction client */
type TxClient = Parameters<Parameters<typeof db.$transaction>[0]>[0];

interface InventoryParams {
  storeCode: string;
  itemId: string;
  quantity: number;
  locationId: string;
  referenceType: string;
  referenceId: string;
  createdBy: string;
  notes?: string;
  /** Pass an outer transaction client to join an existing transaction */
  tx?: TxClient;
}

/**
 * High-level engine for managing inventory stock and transactions for as-deco.
 */
export const InventoryEngine = {
  /**
   * Credits stock to a store (increases quantity).
   */
  async credit(params: InventoryParams) {
    const {
      storeCode, itemId, quantity, locationId, 
      referenceType, referenceId, createdBy, notes,
      tx: externalTx,
    } = params;

    const qty = Math.floor(quantity);
    const store = await this._getStore(storeCode);

    const execute = async (tx: TxClient) => {
      // 1. Find existing stock row
      const existing = await tx.inventoryStock.findFirst({
        where: {
          storeId: store.id,
          itemId,
          locationId,
        },
      });

      const stock = existing
        ? await tx.inventoryStock.update({
            where: { id: existing.id },
            data: { currentQty: { increment: qty } },
          })
        : await tx.inventoryStock.create({
            data: {
              storeId: store.id,
              itemId,
              locationId,
              currentQty: qty,
            },
          });

      // 2. Record Transaction
      await tx.inventoryTransaction.create({
        data: {
          storeId: store.id,
          itemId,
          locationId,
          transactionType: TransactionType.credit,
          quantity: qty,
          referenceType,
          referenceId,
          createdBy,
          notes,
        },
      });

      // 3. Log Audit
      await logAction({
        userId: createdBy,
        action: AuditAction.update,
        module: "inventory",
        recordId: stock.id,
        recordTable: "inventory_stock",
        newValues: stock,
        ipAddress: "system",
        tx,
      });

      return stock;
    };

    return externalTx ? await execute(externalTx) : await db.$transaction(execute);
  },

  /**
   * Debits stock from a store (decreases quantity).
   * Throws error if insufficient stock.
   */
  async debit(params: InventoryParams) {
    const {
      storeCode, itemId, quantity, locationId, 
      referenceType, referenceId, createdBy, notes,
      tx: externalTx,
    } = params;

    const qty = Math.floor(quantity);
    const store = await this._getStore(storeCode);

    const execute = async (tx: TxClient) => {
      // 1. Check current level
      const stock = await tx.inventoryStock.findFirst({
        where: {
          storeId: store.id,
          itemId,
          locationId,
        },
      });

      if (!stock || stock.currentQty < qty) {
        throw new Error(`Insufficient stock in ${store.storeName}. Available: ${stock?.currentQty || 0}`);
      }

      // 2. Decrement
      const updatedStock = await tx.inventoryStock.update({
        where: { id: stock.id },
        data: {
          currentQty: { decrement: qty },
        },
      });

      // 3. Record Transaction
      await tx.inventoryTransaction.create({
        data: {
          storeId: store.id,
          itemId,
          locationId,
          transactionType: TransactionType.debit,
          quantity: qty,
          referenceType,
          referenceId,
          createdBy,
          notes,
        },
      });

      // 4. Log Audit
      await logAction({
        userId: createdBy,
        action: AuditAction.update,
        module: "inventory",
        recordId: updatedStock.id,
        recordTable: "inventory_stock",
        newValues: updatedStock,
        ipAddress: "system",
        tx,
      });

      return updatedStock;
    };

    return externalTx ? await execute(externalTx) : await db.$transaction(execute);
  },

  /**
   * Internal helper to get store by code.
   */
  async _getStore(storeCode: string) {
    const store = await db.inventoryStore.findUnique({
      where: { storeCode },
    });
    if (!store) throw new Error(`Inventory Store '${storeCode}' not found.`);
    return store;
  },
};

export type { TxClient };
