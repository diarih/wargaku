import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  getHouseholdCompleteness,
  householdHousingStatusOptions,
} from "~/server/households";

function csvEscape(value: string | number | boolean | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}

async function getHouseholdsExport(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const completenessFilter = searchParams.get("completeness") ?? "all";
  const activeFilter = searchParams.get("active") ?? "all";
  const housingFilter = searchParams.get("housing") ?? "all";

  const households = await db.household.findMany({
    where: {
      ...(query
        ? {
            OR: [
              { noKk: { contains: query, mode: "insensitive" } },
              { kepalaKeluarga: { contains: query, mode: "insensitive" } },
              { alamat: { contains: query, mode: "insensitive" } },
              { kelurahan: { contains: query, mode: "insensitive" } },
              { kecamatan: { contains: query, mode: "insensitive" } },
              {
                residents: {
                  some: {
                    namaLengkap: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
      ...(activeFilter === "all"
        ? {}
        : { statusAktif: activeFilter === "active" }),
      ...(housingFilter === "all" ||
      !householdHousingStatusOptions.includes(
        housingFilter as (typeof householdHousingStatusOptions)[number],
      )
        ? {}
        : {
            statusTempatTinggal:
              housingFilter as (typeof householdHousingStatusOptions)[number],
          }),
    },
    orderBy: { updatedAt: "desc" },
    include: {
      residents: {
        select: {
          id: true,
          nik: true,
          namaLengkap: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          hubunganDalamKk: true,
          isKepalaKeluarga: true,
          agama: true,
          pendidikan: true,
          pekerjaan: true,
          statusPerkawinan: true,
        },
      },
      _count: {
        select: { residents: true },
      },
    },
  });

  const filteredHouseholds = households.filter((household) => {
    if (completenessFilter === "all") return true;
    return getHouseholdCompleteness(household).status === completenessFilter;
  });

  const headers = [
    "noKk",
    "kepalaKeluarga",
    "alamat",
    "rt",
    "rw",
    "kelurahan",
    "kecamatan",
    "kota",
    "provinsi",
    "kodePos",
    "statusTempatTinggal",
    "phone",
    "statusAktif",
    "jumlahAnggota",
    "skorKelengkapan",
    "statusKelengkapan",
  ];

  const lines = [headers.map(csvEscape).join(",")];

  for (const household of filteredHouseholds) {
    const completeness = getHouseholdCompleteness(household);
    const head =
      completeness.headOfFamily?.namaLengkap ?? household.kepalaKeluarga;

    lines.push(
      [
        household.noKk,
        head,
        household.alamat,
        household.rt,
        household.rw,
        household.kelurahan,
        household.kecamatan,
        household.kota,
        household.provinsi,
        household.kodePos,
        household.statusTempatTinggal,
        household.phone,
        household.statusAktif ? "Aktif" : "Nonaktif",
        household._count.residents,
        completeness.score,
        completeness.status,
      ]
        .map(csvEscape)
        .join(","),
    );
  }

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kartu-keluarga.csv"',
    },
  });
}

async function getHouseholdsExportAuthed(
  request: Request & { auth?: { user?: { id?: string } } | null },
) {
  if (!request.auth?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  return getHouseholdsExport(request);
}

export const GET = auth(getHouseholdsExportAuthed) as unknown as (
  request: Request,
) => Promise<Response>;
