import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { normalizeOptional, parseHouseholdPayload } from "~/server/households";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const payload = parseHouseholdPayload(await request.json());

    await db.household.update({
      where: { id },
      data: {
        noKk: payload.noKk,
        alamat: payload.alamat,
        rt: payload.rt,
        rw: payload.rw,
        kelurahan: payload.kelurahan,
        kecamatan: payload.kecamatan,
        kota: payload.kota,
        provinsi: payload.provinsi,
        kodePos: normalizeOptional(payload.kodePos),
        statusAktif: payload.statusAktif,
      },
    });

    return NextResponse.json({ redirectTo: `/dashboard/kk/${id}` });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "Nomor KK sudah digunakan." },
        { status: 409 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Gagal memperbarui data KK." },
      { status: 500 },
    );
  }
}
