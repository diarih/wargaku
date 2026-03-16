import { HouseholdForm } from "~/app/dashboard/_components/household-form";

export default function NewHouseholdPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tambah Kartu Keluarga
        </h1>
        <p className="text-muted-foreground text-sm">
          Buat data KK baru terlebih dahulu, lalu lanjutkan dengan menambahkan
          anggota keluarga.
        </p>
      </section>

      <HouseholdForm mode="create" />
    </div>
  );
}
