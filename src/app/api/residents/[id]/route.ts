import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { recordAuditEvent } from "~/server/audit";
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

async function patchResident(
  request: Request,
  context: RouteContext,
  actor?: { id?: string; name?: string | null },
) {
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
            hubunganDalamKk: "",
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
        },
      });

      await syncHouseholdHeadOfFamily(tx, payload.householdId);

      return updated;
    });

    await recordAuditEvent({
      type: "RESIDENT_UPDATED",
      entityType: "RESIDENT",
      entityId: id,
      householdId: resident.householdId,
      residentId: id,
      actorId: actor?.id ?? null,
      actorName: actor?.name,
      summary: `Warga ${payload.namaLengkap} diperbarui.`,
      metadata: { fallbackKey: `resident:${id}:updated` },
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

async function patchResidentAuthed(
  request: Request & {
    auth?: { user?: { id?: string; name?: string | null } } | null;
  },
  context: { params?: Record<string, string | string[]> },
) {
  if (!request.auth?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return patchResident(
    request,
    {
      params: Promise.resolve({ id: String(context.params?.id ?? "") }),
    },
    request.auth.user,
  );
}

export const PATCH = auth(
  patchResidentAuthed,
) as unknown as typeof patchResident;
