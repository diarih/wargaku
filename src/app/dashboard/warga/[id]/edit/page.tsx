import { notFound } from "next/navigation";
import { format } from "date-fns";

import { ResidentForm } from "~/app/dashboard/_components/resident-form";
import { db } from "~/server/db";

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

      <ResidentForm
        mode="edit"
        residentId={resident.id}
        householdId={resident.household.id}
        householdLabel={resident.household.noKk}
        initialValues={{
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
          agama: resident.agama ?? "",
          pendidikan: resident.pendidikan ?? "",
          pekerjaan: resident.pekerjaan ?? "",
          statusPerkawinan: resident.statusPerkawinan ?? "",
          statusTinggal: resident.statusTinggal ?? "",
          phone: resident.phone ?? "",
          email: resident.email ?? "",
          isActive: resident.isActive,
        }}
      />
    </div>
  );
}
