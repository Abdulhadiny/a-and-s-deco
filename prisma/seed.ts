import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create admin user
  const passwordHash = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@asdeco.com" },
    update: {},
    create: {
      
      name: "CEO",
      email: "admin@asdeco.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  // Create categories
  const categories = [
    { name: "Chandeliers", description: "Crystal and gold chandeliers" },
    { name: "Executive Sofas", description: "VIP seating furniture" },
    { name: "Veils & Draping", description: "Fabric draping and veils" },
    { name: "Lighting", description: "LED and decorative lighting" },
    { name: "Cutlery & Tableware", description: "Plates, glasses, cutlery sets" },
    { name: "Centerpieces", description: "Table centerpieces and arrangements" },
    { name: "Canopies & Tents", description: "Event canopies and tent structures" },
    { name: "Chairs", description: "Event chairs (Chiavari, banquet, etc.)" },
  ];

  for (const cat of categories) {
    await prisma.itemCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("Seed complete: admin user (admin@asdeco.com / admin123) + 8 categories");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
