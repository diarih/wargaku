import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  normalizeOptional,
  parseResidentPayload,
  toDateValue,
} from "~/server/households";
import { syncHouseholdHeadOfFamily } from "~/server/household-head";

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
    const payload = parseResidentPayload(await request.json());

    const resident = await db.$transaction(async (tx) => {
      if (payload.isKepalaKeluarga) {
        await tx.resident.updateMany({
          where: {
            householdId: payload.householdId,
            isKepalaKeluarga: true,
            id: { not: id },
          },
          data: {
            isKepalaKeluarga: false,
          },
        });
      }

      const updated = await tx.resident.update({
        where: { id },
        data: {
          householdId: payload.householdId,
          nik: payload.nik,
          namaLengkap: payload.namaLengkap,
          jenisKelamin: payload.jenisKelamin,
          tempatLahir: normalizeOptional(payload.tempatLahir),
          tanggalLahir: toDateValue(payload.tanggalLahir),
          hubunganDalamKk: payload.hubunganDalamKk,
          isKepalaKeluarga: payload.isKepalaKeluarga,
          agama: normalizeOptional(payload.agama),
          pendidikan: normalizeOptional(payload.pendidikan),
          pekerjaan: normalizeOptional(payload.pekerjaan),
          statusPerkawinan: normalizeOptional(payload.statusPerkawinan),
          statusTinggal: normalizeOptional(payload.statusTinggal),
          phone: normalizeOptional(payload.phone),
          email: normalizeOptional(payload.email),
          isActive: payload.isActive,
        },
      });

      await syncHouseholdHeadOfFamily(tx, payload.householdId);

      return updated;
    });

    return NextResponse.json({
      redirectTo: `/dashboard/kk/${resident.householdId}`,
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "NIK sudah digunakan." },
        { status: 409 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Gagal memperbarui anggota keluarga." },
      { status: 500 },
    );
  }
}
