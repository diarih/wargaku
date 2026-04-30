import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { recordAuditEvent } from "~/server/audit";
import { db } from "~/server/db";
import { parseHouseholdPayload, normalizeOptional } from "~/server/households";

async function postHousehold(
  request: Request,
  userId: string,
  actorName?: string | null,
) {
  try {
    const payload = parseHouseholdPayload(await request.json());
    const household = await db.household.create({
      data: {
        noKk: payload.noKk,
        kepalaKeluarga: "",
        alamat: payload.alamat,
        rt: payload.rt,
        rw: payload.rw,
        kelurahan: payload.kelurahan,
        kecamatan: payload.kecamatan,
        kota: payload.kota,
        provinsi: payload.provinsi,
        kodePos: normalizeOptional(payload.kodePos),
        phone: normalizeOptional(payload.phone),
        statusTempatTinggal: normalizeOptional(payload.statusTempatTinggal),
        statusAktif: payload.statusAktif,
        createdById: userId,
      },
      select: { id: true },
    });

    await recordAuditEvent({
      type: "HOUSEHOLD_CREATED",
      entityType: "HOUSEHOLD",
      entityId: household.id,
      householdId: household.id,
      actorId: userId,
      actorName,
      summary: `KK ${payload.noKk} dibuat.`,
      metadata: { fallbackKey: `household:${household.id}:created` },
    });

    return NextResponse.json({
      householdId: household.id,
      redirectTo: `/dashboard/kk/${household.id}/warga/new?onboarding=1`,
    });
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
      { message: "Gagal membuat data KK." },
      { status: 500 },
    );
  }
}

async function postHouseholdAuthed(
  request: Request & {
    auth?: { user?: { id?: string; name?: string | null } } | null;
  },
) {
  const userId = request.auth?.user?.id;

  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return postHousehold(request, userId, request.auth?.user?.name);
}

export const POST = auth(postHouseholdAuthed) as unknown as (
  request: Request,
) => Promise<Response>;
