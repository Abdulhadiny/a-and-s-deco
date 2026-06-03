# Refactoring Plan: Unified A&S Deco Management System (V3)

This plan outlines the final state of the **as-deco** system, merging its current event-decoration features with the high-integrity architectural patterns of **mai-fitila-and-sons**.

## 1. The Unified Vision: Final System State
The goal is a single, cohesive platform where existing event management logic is supercharged by industrial-grade inventory and financial tracking.

### A. Core Feature Mapping
| Existing Feature | Enhanced Architectural Implementation |
| :--- | :--- |
| **Item Catalog** | Integrated into a **Multi-Location Inventory Stock** system. Items are no longer just "Available"; they are "Available at [Location X]". |
| **Event Management** | Controlled by the **Rental Engine**. Status changes (Upcoming → In Progress) trigger atomic stock allocations and audit logs. |
| **Quotes & Billing** | Linked to the **Finance & Reconciliation Engine**. Quotes generate professional Invoices/Receipts and track partial payments/balances. |
| **Customer Mgmt** | Enhanced with **Customer Ledgers** showing historical spend, outstanding balances, and total events. |
| **User Roles** | Migrated from a simple enum to a **Granular Permission System** (e.g., `event:create`, `inventory:audit`). |

### B. New System Pillars
- **Transactional Integrity:** No data is modified without an accompanying record in `InventoryTransaction` or `AuditLog`.
- **Multi-Location Ready:** Designed to handle items across various warehouses or event sites simultaneously.
- **Operational Intelligence:** New reports (P&L, Item Utilization, Overdue Returns) built on the ledger data.

## 2. Updated Implementation Roadmap

### Phase 1: Foundation & Data-Aware Schema
1.  **Schema Merge:** Update `prisma/schema.prisma` to include:
    *   `Location`, `InventoryTransaction`, `InventoryStock`.
    *   `AuditLog`, `Role`, `Permission`, `SystemConfig`.
    *   `ExpenseCategory`, `Expense`.
2.  **Audit Utilities:** Port `src/lib/audit.ts` and integrate it into a new base action wrapper.
3.  **Migration Script:** Create a script to move existing `Item` counts into a default "Main Warehouse" location.

### Phase 2: Logic Layer (The Engines)
1.  **The Rental Engine:** Implement `allocateItem` and `returnItem` logic that handles `EventItem` status updates + `InventoryTransaction` records.
2.  **The Finance Engine:** Implement payment reconciliation for `Quotes` and `Events`.
3.  **The Audit Engine:** Auto-log all changes to Events, Items, and Customers.

### Phase 3: Unified Dashboard & Settings
1.  **Shell Port:** Replace the current `as-deco` sidebar with the **Mai Fitila Navigation System**.
2.  **Settings Hub:** Build the UI for managing Locations, Product Categories, Expenses, and Permissions.
3.  **System Config:** Implement the key-value store for business defaults (Invoice prefixes, VAT, etc.).

### Phase 4: Refactored Operations
1.  **Event Flow:** Update the "Create Event" and "Add Items" actions to use the Rental Engine.
2.  **Return Flow:** Implement a "Return & Inspect" UI for items coming back from events, updating condition notes and stock levels atomically.
3.  **Financials:** Implement the "Payment Entry" UI that updates the Customer Ledger.

### Phase 5: Advanced Reporting & UX
1.  **P&L View:** Port the P&L calculator to show "Event Income vs. Operational Expenses".
2.  **Inventory Health:** A dashboard showing "Items Out", "Damaged Items", and "Stock by Location".
3.  **PDF Suite:** Port the high-quality PDF generators for all client-facing documents.

## 3. Data Integrity & Safety
*   **Transactions:** All critical operations (like allocating items to an event) MUST use `db.$transaction`.
*   **Validation:** Every input is guarded by Zod schemas in `src/lib/validators`.
*   **Auditability:** The `AuditLog` will store "Old Values" vs "New Values" for every major entity.

---
**Final Confirmation:** This plan ensures that no existing `as-deco` functionality is lost, but rather every feature is rebuilt on a foundation that guarantees 100% accuracy and professional scalability. 

**Next Step:** I will begin **Phase 1: Foundation & Schema**.
