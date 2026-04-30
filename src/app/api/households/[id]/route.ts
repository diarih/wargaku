import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { recordAuditEvent } from "~/server/audit";
import { db } from "~/server/db";
import { normalizeOptional, parseHouseholdPayload } from "~/server/households";

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function patchHousehold(
  request: Request,
  context: RouteContext,
  actor?: { id?: string; name?: string | null },
) {
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
        phone: normalizeOptional(payload.phone),
        statusTempatTinggal: normalizeOptional(payload.statusTempatTinggal),
        statusAktif: payload.statusAktif,
      },
    });

    await recordAuditEvent({
      type: "HOUSEHOLD_UPDATED",
      entityType: "HOUSEHOLD",
      entityId: id,
      householdId: id,
      actorId: actor?.id ?? null,
      actorName: actor?.name,
      summary: `KK ${payload.noKk} diperbarui.`,
      metadata: { fallbackKey: `household:${id}:updated` },
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

async function patchHouseholdAuthed(
  request: Request & {
    auth?: { user?: { id?: string; name?: string | null } } | null;
  },
  context: { params?: Record<string, string | string[]> },
) {
  if (!request.auth?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return patchHousehold(
    request,
    {
      params: Promise.resolve({ id: String(context.params?.id ?? "") }),
    },
    request.auth.user,
  );
}

export const PATCH = auth(
  patchHouseholdAuthed,
) as unknown as typeof patchHousehold;
