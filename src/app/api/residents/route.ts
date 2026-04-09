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

async function postResident(request: Request, userId: string) {
  try {
    const payload = parseResidentPayload(await request.json());

    const resident = await db.$transaction(async (tx) => {
      if (payload.isKepalaKeluarga) {
        await tx.resident.updateMany({
          where: {
            householdId: payload.householdId,
            isKepalaKeluarga: true,
          },
          data: {
            isKepalaKeluarga: false,
            hubunganDalamKk: "",
          },
        });
      }

      const created = await tx.resident.create({
        data: {
          householdId: payload.householdId,
          nik: payload.nik,
          namaLengkap: payload.namaLengkap,
          jenisKelamin: payload.jenisKelamin,
          tempatLahir: normalizeOptional(payload.tempatLahir),
          tanggalLahir: toDateValue(payload.tanggalLahir),
          hubunganDalamKk: payload.isKepalaKeluarga
            ? "Kepala Keluarga"
            : payload.hubunganDalamKk === "Kepala Keluarga"
              ? ""
              : payload.hubunganDalamKk,
          isKepalaKeluarga: payload.isKepalaKeluarga,
          agama: normalizeOptional(payload.agama),
          pendidikan: normalizeOptional(payload.pendidikan),
          pekerjaan: normalizeOptional(payload.pekerjaan),
          statusPerkawinan: normalizeOptional(payload.statusPerkawinan),
          isActive: payload.isActive,
          createdById: userId,
        },
      });

      await syncHouseholdHeadOfFamily(tx, payload.householdId);

      return created;
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
      { message: "Gagal menambahkan anggota keluarga." },
      { status: 500 },
    );
  }
}

async function postResidentAuthed(
  request: Request & { auth?: { user?: { id?: string } } | null },
) {
  const userId = request.auth?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return postResident(request, userId);
}

export const POST = auth(postResidentAuthed) as unknown as (
  request: Request,
) => Promise<Response>;
