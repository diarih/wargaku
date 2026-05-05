import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  filterAdminAiSearchResults,
  interpretAdminAiSearchQuery,
} from "~/server/ai/search";

const payloadSchema = z.object({
  query: z.string().trim().min(3, "Masukkan pertanyaan minimal 3 karakter."),
});

async function postAiSearch(
  request: Request & { auth?: { user?: { id?: string } } | null },
) {
  if (!request.auth?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = payloadSchema.parse(await request.json());
    const [intent, households, residents, documents] = await Promise.all([
      interpretAdminAiSearchQuery(payload.query),
      db.household.findMany({
        orderBy: { updatedAt: "desc" },
        take: 100,
        select: {
          id: true,
          noKk: true,
          kepalaKeluarga: true,
          alamat: true,
          rt: true,
          rw: true,
          kelurahan: true,
          kecamatan: true,
          kota: true,
          provinsi: true,
          phone: true,
          statusAktif: true,
          statusTempatTinggal: true,
          files: { select: { id: true } },
          residents: {
            select: {
              id: true,
              namaLengkap: true,
              nik: true,
              jenisKelamin: true,
              tempatLahir: true,
              tanggalLahir: true,
              hubunganDalamKk: true,
              agama: true,
              pendidikan: true,
              pekerjaan: true,
              statusPerkawinan: true,
              isKepalaKeluarga: true,
              isActive: true,
            },
          },
        },
      }),
      db.resident.findMany({
        orderBy: { updatedAt: "desc" },
        take: 120,
        select: {
          id: true,
          namaLengkap: true,
          nik: true,
          hubunganDalamKk: true,
          isActive: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          agama: true,
          pendidikan: true,
          pekerjaan: true,
          statusPerkawinan: true,
          files: { select: { id: true } },
          household: {
            select: { id: true, noKk: true },
          },
        },
      }),
      db.fileAsset.findMany({
        orderBy: { createdAt: "desc" },
        take: 120,
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          householdId: true,
          residentId: true,
          household: { select: { noKk: true } },
          resident: { select: { namaLengkap: true } },
        },
      }),
    ]);

    const results = filterAdminAiSearchResults({
      intent: {
        ...intent,
        keywords: intent.keywords ?? [],
      },
      households,
      residents: residents.map((resident) => ({
        id: resident.id,
        namaLengkap: resident.namaLengkap,
        nik: resident.nik,
        hubunganDalamKk: resident.hubunganDalamKk,
        isActive: resident.isActive,
        householdId: resident.household.id,
        householdNoKk: resident.household.noKk,
        jenisKelamin: resident.jenisKelamin,
        tempatLahir: resident.tempatLahir,
        tanggalLahir: resident.tanggalLahir,
        agama: resident.agama,
        pendidikan: resident.pendidikan,
        pekerjaan: resident.pekerjaan,
        statusPerkawinan: resident.statusPerkawinan,
        files: resident.files,
      })),
      documents: documents.map((document) => ({
        id: document.id,
        fileName: document.fileName,
        mimeType: document.mimeType,
        householdId: document.householdId,
        residentId: document.residentId,
        householdNoKk: document.household?.noKk ?? null,
        residentName: document.resident?.namaLengkap ?? null,
      })),
    });

    return NextResponse.json({ intent, results });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message ?? "Permintaan AI tidak valid." },
        { status: 400 },
      );
    }

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { message: "Gagal menjalankan pencarian AI." },
      { status: 500 },
    );
  }
}

export const POST = auth(postAiSearch) as unknown as (
  request: Request,
) => Promise<Response>;
