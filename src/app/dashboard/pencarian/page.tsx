import Link from "next/link";
import { Search } from "lucide-react";

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
import { Input } from "~/components/ui/input";
import { getInitialsAvatarUrl } from "~/lib/avatar";
import { db } from "~/server/db";
import {
  getHouseholdCompleteness,
  getResidentCompleteness,
} from "~/server/households";

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q = "" } = await searchParams;
  const query = q.trim();

  const [households, residents] = query
    ? await Promise.all([
        db.household.findMany({
          where: {
            OR: [
              { noKk: { contains: query, mode: "insensitive" } },
              { kepalaKeluarga: { contains: query, mode: "insensitive" } },
              {
                residents: {
                  some: {
                    namaLengkap: { contains: query, mode: "insensitive" },
                  },
                },
              },
            ],
          },
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
            _count: { select: { residents: true } },
          },
          take: 10,
        }),
        db.resident.findMany({
          where: {
            OR: [
              { nik: { contains: query, mode: "insensitive" } },
              { namaLengkap: { contains: query, mode: "insensitive" } },
              { household: { noKk: { contains: query, mode: "insensitive" } } },
            ],
          },
          include: {
            household: {
              select: {
                id: true,
                noKk: true,
              },
            },
          },
          take: 10,
        }),
      ])
    : [[], []];

  return (
    <div className="space-y-6">
      <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pencarian Data
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cari cepat berdasarkan No KK, NIK, nama warga, atau kepala keluarga
          untuk masuk langsung ke data terkait.
        </p>

        <form className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Input
            name="q"
            defaultValue={query}
            placeholder="Cari No KK, NIK, nama lengkap, atau kepala keluarga"
            className="h-11"
          />
          <Button type="submit" size="lg">
            <Search className="size-4" />
            Cari data
          </Button>
        </form>
      </section>

      {!query ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Mulai pencarian</CardTitle>
            <CardDescription>
              Masukkan kata kunci untuk menelusuri KK dan anggota keluarga dari
              satu halaman.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <section className="grid gap-4 xl:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Hasil Kartu Keluarga</CardTitle>
              <CardDescription>
                {households.length} hasil ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {households.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                  Tidak ada KK yang cocok dengan pencarian ini.
                </div>
              ) : (
                households.map((household) => {
                  const completeness = getHouseholdCompleteness(household);
                  const head = completeness.headOfFamily;

                  return (
                    <div
                      key={household.id}
                      className="bg-muted/30 rounded-2xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <InitialsAvatar
                          seed={head?.namaLengkap ?? household.noKk}
                          alt={`Avatar ${head?.namaLengkap ?? household.noKk}`}
                          src={getInitialsAvatarUrl(
                            head?.namaLengkap ?? household.noKk,
                          )}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              No. KK {household.noKk}
                            </p>
                            <CompletenessBadge
                              status={completeness.status}
                              score={completeness.score}
                            />
                          </div>
                          <p className="text-sm font-medium">
                            {head?.namaLengkap ??
                              "Kepala keluarga belum dipilih"}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {household.alamat}, RT {household.rt}/RW{" "}
                            {household.rw}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="outline">
                              {household._count.residents} anggota
                            </Badge>
                            <Button
                              nativeButton={false}
                              variant="outline"
                              render={
                                <Link href={`/dashboard/kk/${household.id}`} />
                              }
                            >
                              Lihat detail
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hasil Anggota Keluarga</CardTitle>
              <CardDescription>
                {residents.length} hasil ditemukan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {residents.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                  Tidak ada anggota keluarga yang cocok dengan pencarian ini.
                </div>
              ) : (
                residents.map((resident) => {
                  const completeness = getResidentCompleteness(resident);

                  return (
                    <div
                      key={resident.id}
                      className="bg-muted/30 rounded-2xl border p-4"
                    >
                      <div className="flex items-start gap-3">
                        <InitialsAvatar
                          seed={resident.namaLengkap}
                          alt={`Avatar ${resident.namaLengkap}`}
                          src={getInitialsAvatarUrl(resident.namaLengkap)}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold">
                              {resident.namaLengkap}
                            </p>
                            {resident.isKepalaKeluarga ? (
                              <Badge>Kepala Keluarga</Badge>
                            ) : null}
                            <CompletenessBadge
                              status={completeness.status}
                              score={completeness.score}
                            />
                          </div>
                          <p className="text-muted-foreground text-xs">
                            NIK {resident.nik} - {resident.hubunganDalamKk}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            KK {resident.household.noKk}
                          </p>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              nativeButton={false}
                              variant="outline"
                              render={
                                <Link
                                  href={`/dashboard/warga/${resident.id}/edit`}
                                />
                              }
                            >
                              Edit anggota
                            </Button>
                            <Button
                              nativeButton={false}
                              variant="outline"
                              render={
                                <Link
                                  href={`/dashboard/kk/${resident.household.id}`}
                                />
                              }
                            >
                              Buka KK
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
