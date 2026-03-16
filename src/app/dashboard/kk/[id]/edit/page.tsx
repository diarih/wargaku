import { notFound } from "next/navigation";

import { HouseholdForm } from "~/app/dashboard/_components/household-form";
import { db } from "~/server/db";

type EditHouseholdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditHouseholdPage({
  params,
}: EditHouseholdPageProps) {
  const { id } = await params;
  const household = await db.household.findUnique({ where: { id } });

  if (!household) {
    notFound();
  }

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

      <HouseholdForm
        mode="edit"
        householdId={household.id}
        initialValues={{
          noKk: household.noKk,
          alamat: household.alamat,
          rt: household.rt,
          rw: household.rw,
          kelurahan: household.kelurahan,
          kecamatan: household.kecamatan,
          kota: household.kota,
          provinsi: household.provinsi,
          kodePos: household.kodePos ?? "",
          statusAktif: household.statusAktif,
        }}
      />
    </div>
  );
}
