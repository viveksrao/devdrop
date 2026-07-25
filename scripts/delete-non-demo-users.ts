import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "demo@devstash.io";

async function main() {
  const force = process.argv.includes("--force");

  const usersToDelete = await prisma.user.findMany({
    where: { email: { not: DEMO_USER_EMAIL } },
    select: { id: true, email: true, name: true },
  });

  if (usersToDelete.length === 0) {
    console.log("No non-demo users found. Nothing to do.");
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) to delete:`);
  for (const user of usersToDelete) {
    console.log(`- ${user.email} (${user.name ?? "no name"})`);
  }

  if (!force) {
    console.log(
      "\nDry run only — no data was deleted. Re-run with --force to actually delete these users and all their items, collections, custom item types, accounts, and sessions."
    );
    return;
  }

  const emailsToDelete = usersToDelete.map((u) => u.email);

  const result = await prisma.user.deleteMany({
    where: { email: { not: DEMO_USER_EMAIL } },
  });

  const { count: verificationTokensDeleted } = await prisma.verificationToken.deleteMany({
    where: { identifier: { in: emailsToDelete } },
  });

  console.log(
    `\nDeleted ${result.count} user(s) (and their items, collections, custom item types, accounts, and sessions via cascade).`
  );
  console.log(`Deleted ${verificationTokensDeleted} orphaned verification token(s).`);
}

main()
  .catch((e) => {
    console.error("Failed to delete non-demo users:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
