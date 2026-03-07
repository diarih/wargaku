import "dotenv/config";

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "ADMIN_USERNAME and ADMIN_PASSWORD are required for seeding",
    );
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.upsert({
    where: { username },
    update: {
      passwordHash,
      isActive: true,
      name: "Administrator",
    },
    create: {
      username,
      passwordHash,
      isActive: true,
      name: "Administrator",
    },
  });

  console.log(`Admin user '${username}' is ready.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
