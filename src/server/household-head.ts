import type { Prisma, PrismaClient } from "@prisma/client";

type DbLike = PrismaClient | Prisma.TransactionClient;

export async function syncHouseholdHeadOfFamily(
  client: DbLike,
  householdId: string,
) {
  const head = await client.resident.findFirst({
    where: {
      householdId,
      isKepalaKeluarga: true,
    },
    orderBy: { updatedAt: "desc" },
    select: {
      namaLengkap: true,
    },
  });

  await client.household.update({
    where: { id: householdId },
    data: {
      kepalaKeluarga: head?.namaLengkap ?? "",
    },
  });
}
