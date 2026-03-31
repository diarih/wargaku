import Link from "next/link";
import { Plus, Search as SearchIcon, Users, X } from "lucide-react";

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
  householdHousingStatusOptions,
} from "~/server/households";

type HouseholdPageProps = {
  searchParams: Promise<{
    q?: string;
    completeness?: "all" | "complete" | "warning" | "critical";
    active?: "all" | "active" | "inactive";
    housing?: (typeof householdHousingStatusOptions)[number] | "all";
  }>;
};

export default async function HouseholdPage({
  searchParams,
}: HouseholdPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const completenessFilter = params.completeness ?? "all";
  const activeFilter = params.active ?? "all";
  const housingFilter = params.housing ?? "all";

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
      ...(housingFilter === "all"
        ? {}
        : { statusTempatTinggal: housingFilter }),
    },
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
        },
      },
      _count: {
        select: {
          residents: true,
        },
      },
    },
    take: 100,
  });

  const filteredHouseholds = households.filter((household) => {
    if (completenessFilter === "all") return true;
    return getHouseholdCompleteness(household).status === completenessFilter;
  });

  const hasFilters =
    query.length > 0 ||
    completenessFilter !== "all" ||
    activeFilter !== "all" ||
    housingFilter !== "all";

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

      <Card>
        <CardHeader>
          <CardTitle>Filter Data KK</CardTitle>
          <CardDescription>
            Persempit daftar berdasarkan kata kunci, kelengkapan, status aktif,
            atau tempat tinggal.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 lg:grid-cols-[1.4fr_repeat(3,minmax(0,1fr))_auto]">
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Cari No KK, kepala keluarga, alamat, atau nama warga"
                className="h-10 pl-9"
              />
            </div>

            <select
              name="completeness"
              defaultValue={completenessFilter}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua kelengkapan</option>
              <option value="complete">Lengkap</option>
              <option value="warning">Perlu dilengkapi</option>
              <option value="critical">Kritis</option>
            </select>

            <select
              name="active"
              defaultValue={activeFilter}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            <select
              name="housing"
              defaultValue={housingFilter}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua tempat tinggal</option>
              {householdHousingStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <Button type="submit" variant="default" className="h-10">
                Terapkan
              </Button>
              {hasFilters ? (
                <Button
                  nativeButton={false}
                  type="button"
                  variant="ghost"
                  render={<Link href="/dashboard/kk" />}
                  className="h-10"
                >
                  <X className="size-4" />
                  Reset
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {filteredHouseholds.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>
                {hasFilters
                  ? "Tidak ada hasil yang cocok"
                  : "Belum ada data KK"}
              </CardTitle>
              <CardDescription>
                {hasFilters
                  ? "Coba ubah kata kunci atau filter untuk menemukan data yang Anda cari."
                  : "Mulai dari membuat data KK baru, lalu tambahkan anggota keluarga satu per satu."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              {hasFilters ? (
                <Button
                  nativeButton={false}
                  variant="outline"
                  render={<Link href="/dashboard/kk" />}
                >
                  Reset filter
                </Button>
              ) : null}
              <Button
                nativeButton={false}
                render={<Link href="/dashboard/kk/new" />}
              >
                Tambah KK
              </Button>
            </CardContent>
          </Card>
        ) : (
          filteredHouseholds.map((household) => {
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
                        <p className="text-muted-foreground text-xs">
                          Tempat tinggal:{" "}
                          {household.statusTempatTinggal ?? "Belum diisi"}
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
