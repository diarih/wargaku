import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const username = process.env.PLAYWRIGHT_ADMIN_USERNAME ?? "playwright-admin";
const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "Playwright123!";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      isActive: true,
      name: "Playwright Admin",
    },
    create: {
      username,
      passwordHash,
      isActive: true,
      name: "Playwright Admin",
    },
  });

  console.log(`Playwright user '${username}' is ready.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
