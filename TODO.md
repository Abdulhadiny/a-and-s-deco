# Implementation Checklist: A&S Deco Refactoring

This checklist tracks the progress of the refactoring process based on the `PLAN.md` (V3).

## Phase 1: Foundation & Multi-Location Schema
- [x] **Schema Upgrade**: Update `prisma/schema.prisma` with:
    - [x] `Location` model
    - [x] `InventoryTransaction` & `InventoryStock` models
    - [x] `AuditLog` model
    - [x] `Role` & `Permission` models
    - [x] `SystemConfig` model
    - [x] `ExpenseCategory` & `Expense` models
- [x] **Prisma Sync**: Run `npx prisma generate` and `npx prisma db push` (or migrate).
- [x] **Base Utilities**:
    - [x] Port/Update `src/lib/db.ts`
    - [x] Port `src/lib/audit.ts`
- [ ] **Data Migration**: Create script to move existing items to a "Main Warehouse" location. (Handled by Seed Script)
- [x] **Seed Script**: Create `prisma/seed.ts` with default roles, permissions, and locations.

## Phase 2: Logic Layer (The Engines)
- [x] **Rental Engine**: Implement `src/lib/engines/inventory-engine.ts` and `src/lib/engines/rental-engine.ts` (`allocate`, `return`, `adjust`).
- [x] **Finance Engine**: Implement `src/lib/engines/finance-engine.ts` (Payment reconciliation).
- [x] **Audit Integration**: Wrap core logic in `logAction()`.

## Phase 3: Unified Dashboard & Settings
- [x] **UI Shell**: Replace current dashboard layout with the "Mai Fitila" sidebar.
- [x] **Settings Hub**:
    - [x] Location Management UI
    - [x] Category & Catalog Management UI
    - [x] User & Permission UI
- [x] **System Config**: Implement UI for managing business defaults.

## Phase 4: Refactored Operations
- [ ] **Event Lifecycle**:
    - [ ] Update Event Create/Edit to use `InventoryEngine`.
    - [ ] Implement "Return & Inspect" workflow.
- [ ] **Customer Financials**:
    - [ ] Implement "Payment Entry" interface.
    - [ ] Implement "Customer Ledger" view.
- [ ] **Inventory Management**: Update Item Create/Edit to support multi-location stock.

## Phase 5: Advanced Reporting & UX
- [ ] **P&L Reporting**: Port the P&L calculator and dashboard.
- [ ] **Inventory Insights**: Create "Item Utilization" and "Stock Health" reports.
- [ ] **Document Suite**:
    - [ ] Port PDF Invoice generator.
    - [ ] Port PDF Receipt generator.
    - [ ] Enhance PDF Quote generator.
- [ ] **Final Polish**: Standardize all forms (Zod + react-hook-form) and consistent styling.
