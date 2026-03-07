import Link from "next/link";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { db } from "~/server/db";

export default async function HouseholdPage() {
  const households = await db.household.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: {
          residents: true,
        },
      },
    },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">
          Data Kartu Keluarga
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Pantau dan akses detail setiap keluarga, termasuk jumlah anggota
          aktif.
        </p>
      </section>

      <section className="grid gap-4">
        {households.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Belum ada data KK</CardTitle>
              <CardDescription>
                Data kartu keluarga akan muncul di sini setelah proses input.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          households.map((household: (typeof households)[number]) => (
            <Card key={household.id} className="transition hover:shadow-sm">
              <CardContent className="flex flex-col justify-between gap-4 py-5 md:flex-row md:items-center">
                <div className="space-y-1">
                  <p className="text-sm font-semibold">
                    No. KK {household.noKk}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {household.kepalaKeluarga} • {household.alamat}, RT{" "}
                    {household.rt}/RW {household.rw}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {household.kelurahan}, {household.kecamatan},{" "}
                    {household.kota}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={household.statusAktif ? "secondary" : "outline"}
                  >
                    {household.statusAktif ? "Aktif" : "Nonaktif"}
                  </Badge>
                  <Badge variant="outline">
                    {household._count.residents} anggota
                  </Badge>
                  <Link
                    href={`/dashboard/kk/${household.id}`}
                    className="text-primary text-sm font-medium"
                  >
                    Lihat detail
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
