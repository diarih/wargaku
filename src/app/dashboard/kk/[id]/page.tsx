import { notFound } from "next/navigation";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/server/db";

type HouseholdDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdDetailPage({
  params,
}: HouseholdDetailPageProps) {
  const { id } = await params;

  const household = await db.household.findUnique({
    where: { id },
    include: {
      residents: {
        orderBy: { namaLengkap: "asc" },
      },
      files: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!household) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Detail Kartu Keluarga
        </h1>
        <p className="text-muted-foreground text-sm">No. KK {household.noKk}</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>{household.kepalaKeluarga}</CardTitle>
          <CardDescription>
            {household.alamat}, RT {household.rt}/RW {household.rw},{" "}
            {household.kelurahan}, {household.kecamatan}, {household.kota}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Badge variant={household.statusAktif ? "secondary" : "outline"}>
            {household.statusAktif ? "KK Aktif" : "KK Nonaktif"}
          </Badge>
          <Badge variant="outline">{household.residents.length} anggota</Badge>
          <Badge variant="outline">
            {household.files.length} berkas terbaru
          </Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Anggota Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {household.residents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Belum ada anggota tercatat.
            </p>
          ) : (
            household.residents.map(
              (resident: (typeof household.residents)[number]) => (
                <div
                  key={resident.id}
                  className="bg-muted/40 flex items-center justify-between rounded-xl border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {resident.namaLengkap}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      NIK {resident.nik} • {resident.hubunganDalamKk}
                    </p>
                  </div>
                  <Badge variant={resident.isActive ? "secondary" : "outline"}>
                    {resident.isActive ? "Aktif" : "Tidak Aktif"}
                  </Badge>
                </div>
              ),
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}
