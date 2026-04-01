import { TriangleAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { HouseholdForm } from "~/app/dashboard/_components/household-form";
import { Card, CardContent } from "~/components/ui/card";
import { db } from "~/server/db";
import {
  getHouseholdCompleteness,
  type HouseholdFormValues,
} from "~/server/households";

type EditHouseholdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHouseholdPage({
  params,
}: EditHouseholdPageProps) {
  const { id } = await params;
  const household = await db.household.findUnique({
    where: { id },
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
    },
  });

  if (!household) {
    notFound();
  }

  const initialValues: Partial<HouseholdFormValues> = {
    noKk: household.noKk,
    alamat: household.alamat,
    rt: household.rt,
    rw: household.rw,
    kelurahan: household.kelurahan,
    kecamatan: household.kecamatan,
    kota: household.kota,
    provinsi: household.provinsi,
    kodePos: household.kodePos ?? "",
    phone: household.phone ?? "",
    statusTempatTinggal:
      (household.statusTempatTinggal as HouseholdFormValues["statusTempatTinggal"]) ??
      "",
    statusAktif: household.statusAktif,
  };
  const completeness = getHouseholdCompleteness(household);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Kartu Keluarga
        </h1>
        <p className="text-muted-foreground text-sm">
          Perbarui identitas dan alamat administrasi untuk KK {household.noKk}.
        </p>
      </section>

      {completeness.missing.length > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex gap-3 p-5">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <p className="font-medium text-amber-900">
                Data KK ini masih bisa disimpan, tetapi beberapa bagian belum
                lengkap.
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm text-amber-800">
                {completeness.missing.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="text-xs text-amber-700">
                Anda tetap bisa menyimpan perubahan dan melengkapi data nanti.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <HouseholdForm
        mode="edit"
        householdId={household.id}
        initialValues={initialValues}
      />
    </div>
  );
}
