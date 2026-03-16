import Link from "next/link";
import { Plus, Users } from "lucide-react";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";
import { InitialsAvatar } from "~/app/dashboard/_components/initials-avatar";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getInitialsAvatarUrl } from "~/lib/avatar";
import { db } from "~/server/db";
import { getHouseholdCompleteness } from "~/server/households";

export default async function HouseholdPage() {
  const households = await db.household.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      residents: {
        orderBy: [{ isKepalaKeluarga: "desc" }, { namaLengkap: "asc" }],
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
          statusTinggal: true,
        },
      },
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
      <section className="bg-background/90 flex flex-col gap-4 rounded-2xl border p-6 shadow-sm md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Data Kartu Keluarga
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            Kelola identitas KK, cek kelengkapan data, lalu lanjutkan pengisian
            anggota keluarga dari satu alur kerja yang rapi.
          </p>
        </div>

        <Button
          nativeButton={false}
          render={<Link href="/dashboard/kk/new" />}
          size="lg"
        >
          <Plus className="size-4" />
          Tambah KK
        </Button>
      </section>

      <section className="grid gap-4">
        {households.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Belum ada data KK</CardTitle>
              <CardDescription>
                Mulai dari membuat data KK baru, lalu tambahkan anggota keluarga
                satu per satu.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                nativeButton={false}
                render={<Link href="/dashboard/kk/new" />}
              >
                Tambah KK pertama
              </Button>
            </CardContent>
          </Card>
        ) : (
          households.map((household) => {
            const completeness = getHouseholdCompleteness(household);
            const head = completeness.headOfFamily;

            return (
              <Card key={household.id} className="transition hover:shadow-sm">
                <CardContent className="flex flex-col gap-5 py-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <InitialsAvatar
                      seed={head?.namaLengkap ?? "KK"}
                      alt={`Avatar ${head?.namaLengkap ?? household.noKk}`}
                      src={getInitialsAvatarUrl(
                        head?.namaLengkap ?? household.noKk,
                      )}
                    />

                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">
                          No. KK {household.noKk}
                        </p>
                        <Badge
                          variant={
                            household.statusAktif ? "secondary" : "outline"
                          }
                        >
                          {household.statusAktif ? "Aktif" : "Nonaktif"}
                        </Badge>
                        <CompletenessBadge
                          status={completeness.status}
                          score={completeness.score}
                        />
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {head?.namaLengkap ?? "Kepala keluarga belum dipilih"}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          {household.alamat}, RT {household.rt}/RW{" "}
                          {household.rw}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {household.kelurahan}, {household.kecamatan},{" "}
                          {household.kota}, {household.provinsi}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Badge variant="outline">
                          <Users className="size-3.5" />
                          {household._count.residents} anggota
                        </Badge>
                        {completeness.missing.slice(0, 2).map((item) => (
                          <Badge
                            key={item}
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link href={`/dashboard/kk/${household.id}/edit`} />
                      }
                    >
                      Edit KK
                    </Button>
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link
                          href={`/dashboard/kk/${household.id}/warga/new`}
                        />
                      }
                    >
                      Tambah anggota
                    </Button>
                    <Button
                      nativeButton={false}
                      render={<Link href={`/dashboard/kk/${household.id}`} />}
                    >
                      Lihat detail
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
