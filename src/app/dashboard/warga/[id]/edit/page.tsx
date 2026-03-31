import { notFound } from "next/navigation";
import { format } from "date-fns";
import { TriangleAlert } from "lucide-react";

import { ResidentForm } from "~/app/dashboard/_components/resident-form";
import { Card, CardContent } from "~/components/ui/card";
import { db } from "~/server/db";
import {
  getResidentCompleteness,
  type ResidentFormValues,
} from "~/server/households";

type EditResidentPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditResidentPage({
  params,
}: EditResidentPageProps) {
  const { id } = await params;
  const resident = await db.resident.findUnique({
    where: { id },
    include: {
      household: {
        select: {
          id: true,
          noKk: true,
        },
      },
    },
  });

  if (!resident) {
    notFound();
  }

  const initialValues: Partial<ResidentFormValues> = {
    householdId: resident.household.id,
    nik: resident.nik,
    namaLengkap: resident.namaLengkap,
    jenisKelamin: resident.jenisKelamin,
    tempatLahir: resident.tempatLahir ?? "",
    tanggalLahir: resident.tanggalLahir
      ? format(resident.tanggalLahir, "yyyy-MM-dd")
      : "",
    hubunganDalamKk: resident.hubunganDalamKk,
    isKepalaKeluarga: resident.isKepalaKeluarga,
    agama: (resident.agama as ResidentFormValues["agama"]) ?? "",
    pendidikan: (resident.pendidikan as ResidentFormValues["pendidikan"]) ?? "",
    pekerjaan: (resident.pekerjaan as ResidentFormValues["pekerjaan"]) ?? "",
    statusPerkawinan:
      (resident.statusPerkawinan as ResidentFormValues["statusPerkawinan"]) ??
      "",
    phone: resident.phone ?? "",
    email: resident.email ?? "",
    isActive: resident.isActive,
  };
  const completeness = getResidentCompleteness(resident);
  const currentHead = resident.isKepalaKeluarga
    ? { id: resident.id, namaLengkap: resident.namaLengkap }
    : resident.householdId
      ? await db.resident.findFirst({
          where: {
            householdId: resident.householdId,
            isKepalaKeluarga: true,
            id: { not: resident.id },
          },
          select: {
            id: true,
            namaLengkap: true,
          },
        })
      : null;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Edit Anggota Keluarga
        </h1>
        <p className="text-muted-foreground text-sm">
          Perbarui data {resident.namaLengkap} untuk KK{" "}
          {resident.household.noKk}.
        </p>
      </section>

      {completeness.missing.length > 0 ? (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="flex gap-3 p-5">
            <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />
            <div className="space-y-2">
              <p className="font-medium text-amber-900">
                Data warga ini masih bisa disimpan, tetapi beberapa field belum
                diisi.
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

      <ResidentForm
        mode="edit"
        residentId={resident.id}
        householdId={resident.household.id}
        householdLabel={resident.household.noKk}
        initialValues={initialValues}
        currentHead={currentHead}
      />
    </div>
  );
}
