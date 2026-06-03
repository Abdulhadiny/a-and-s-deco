import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding as-deco database...\n");

  // ─── 1. LOCATION ────────────────────────────────
  const location = await prisma.location.upsert({
    where: { id: "main-warehouse" },
    update: {},
    create: {
      id: "main-warehouse",
      name: "Main Warehouse",
      address: "Headquarters",
    },
  });
  console.log("+ Location:", location.name);

  // ─── 2. INVENTORY STORES ─────────────────────────
  const storesData = [
    { storeCode: "MAIN", storeName: "Main Stock" },
    { storeCode: "DAMAGED", storeName: "Damaged Items" },
    { storeCode: "LOST", storeName: "Lost/Missing" },
  ];

  for (const store of storesData) {
    await prisma.inventoryStore.upsert({
      where: { storeCode: store.storeCode },
      update: {},
      create: store,
    });
  }
  console.log("+ Inventory stores:", storesData.length);

  // ─── 3. ROLES ────────────────────────────────────
  const rolesData = [
    {
      id: "admin-role",
      name: "admin",
      displayName: "Administrator",
      description: "Full system access",
      isSystem: true,
    },
    {
      id: "staff-role",
      name: "staff",
      displayName: "Staff",
      description: "Standard operational access",
      isSystem: false,
    },
  ];

  for (const role of rolesData) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }
  console.log("+ Roles:", rolesData.length);

  // ─── 4. PERMISSIONS ──────────────────────────────
  const permissionsData = [
    { module: "inventory", action: "read", description: "View inventory" },
    { module: "inventory", action: "manage", description: "Create/Edit items" },
    { module: "inventory", action: "audit", description: "Inventory stock adjustments" },
    { module: "events", action: "read", description: "View events" },
    { module: "events", action: "manage", description: "Create/Edit events" },
    { module: "events", action: "delete", description: "Delete events" },
    { module: "customers", action: "manage", description: "Manage customers" },
    { module: "finance", action: "read", description: "View financial reports" },
    { module: "finance", action: "manage", description: "Record payments/expenses" },
    { module: "users", action: "manage", description: "Manage users/roles" },
    { module: "settings", action: "manage", description: "System settings" },
  ];

  const permissions: Record<string, string> = {};
  for (const perm of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { module_action: { module: perm.module, action: perm.action } },
      update: {},
      create: perm,
    });
    permissions[`${perm.module}:${perm.action}`] = created.id;
  }
  console.log("+ Permissions:", permissionsData.length);

  // ─── 5. ROLE-PERMISSION MAPPINGS ─────────────────
  const adminPerms = permissionsData.map(p => `${p.module}:${p.action}`);
  const staffPerms = [
    "inventory:read",
    "events:read", "events:manage",
    "customers:manage",
  ];

  const rolePermissionMap: Record<string, string[]> = {
    admin: adminPerms,
    staff: staffPerms,
  };

  for (const [roleName, perms] of Object.entries(rolePermissionMap)) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) continue;

    for (const permKey of perms) {
      const permissionId = permissions[permKey];
      if (!permissionId) continue;

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId,
        },
      });
    }
  }
  console.log("+ Role-Permission mappings applied");

  // ─── 6. ADMIN USER ───────────────────────────────
  const passwordHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@asdeco.com" },
    update: {
      roleId: "admin-role",
      locationId: "main-warehouse",
    },
    create: {
      name: "System Admin",
      email: "admin@asdeco.com",
      passwordHash,
      roleId: "admin-role",
      locationId: "main-warehouse",
    },
  });
  console.log("+ Admin user:", adminUser.email);

  // ─── 7. SYSTEM CONFIGS ───────────────────────────
  const configsData = [
    { key: "company_name", value: "A&S Decorations", description: "Business Name" },
    { key: "currency", value: "NGN", description: "System Currency" },
    { key: "currency_symbol", value: "₦", description: "Currency Symbol" },
    { key: "tax_rate", value: 0.075, description: "VAT Rate (7.5%)" },
  ];

  for (const config of configsData) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: {
        key: config.key,
        value: config.value,
        description: config.description,
      },
    });
  }
  console.log("+ System configs:", configsData.length);

  // ─── 8. STOCK INITIALIZATION (Safety Logic) ──────
  // If there are already items but no stock records, initialize them to MAIN warehouse
  const items = await prisma.item.findMany();
  let stockCount = 0;
  for (const item of items) {
    const existingStock = await prisma.inventoryStock.findFirst({
      where: { itemId: item.id, storeId: "MAIN", locationId: "main-warehouse" }
    });
    
    if (!existingStock) {
      await prisma.inventoryStock.create({
        data: {
          itemId: item.id,
          storeId: "MAIN",
          locationId: "main-warehouse",
          currentQty: 10, // Default for existing items if they weren't tracked before
        }
      });
      stockCount++;
    }
  }
  if (stockCount > 0) {
    console.log(`+ Initialized stock for ${stockCount} existing items`);
  }

  console.log("\nSeed complete.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error("Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
