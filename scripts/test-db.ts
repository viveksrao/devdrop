import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const itemTypes = await prisma.itemType.findMany({
    where: { isSystem: true },
  });

  console.log(`Connected. Found ${itemTypes.length} system item types:`);
  for (const type of itemTypes) {
    console.log(`- ${type.name}`);
  }
}

main()
  .catch((e) => {
    console.error("Database connection test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
