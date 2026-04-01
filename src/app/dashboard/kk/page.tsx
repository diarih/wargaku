import Link from "next/link";
import { Download, Plus, Search as SearchIcon, Users, X } from "lucide-react";

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
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function HouseholdPage({
  searchParams,
}: HouseholdPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const completenessFilter = params.completeness ?? "all";
  const activeFilter = params.active ?? "all";
  const housingFilter = params.housing ?? "all";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);

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
    select: {
      id: true,
      noKk: true,
      kepalaKeluarga: true,
      alamat: true,
      rt: true,
      rw: true,
      kelurahan: true,
      kecamatan: true,
      kota: true,
      provinsi: true,
      kodePos: true,
      phone: true,
      statusTempatTinggal: true,
      statusAktif: true,
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
  const exportParams = new URLSearchParams();

  if (query) exportParams.set("q", query);
  if (completenessFilter !== "all")
    exportParams.set("completeness", completenessFilter);
  if (activeFilter !== "all") exportParams.set("active", activeFilter);
  if (housingFilter !== "all") exportParams.set("housing", housingFilter);

  const exportHref = `/api/households/export${exportParams.size > 0 ? `?${exportParams.toString()}` : ""}`;
  const totalItems = filteredHouseholds.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const currentPage =
    Number.isNaN(requestedPage) || requestedPage < 1
      ? 1
      : Math.min(requestedPage, totalPages);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedHouseholds = filteredHouseholds.slice(
    startIndex,
    startIndex + PAGE_SIZE,
  );

  function buildPageHref(page: number) {
    const pageParams = new URLSearchParams();

    if (query) pageParams.set("q", query);
    if (completenessFilter !== "all") {
      pageParams.set("completeness", completenessFilter);
    }
    if (activeFilter !== "all") pageParams.set("active", activeFilter);
    if (housingFilter !== "all") pageParams.set("housing", housingFilter);
    if (page > 1) pageParams.set("page", String(page));

    return `/dashboard/kk${pageParams.size > 0 ? `?${pageParams.toString()}` : ""}`;
  }

  const visiblePages = Array.from(
    { length: totalPages },
    (_, index) => index + 1,
  ).filter(
    (page) =>
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1,
  );

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

        <div className="flex flex-wrap items-center gap-2">
          <Button
            nativeButton={false}
            variant="outline"
            render={<a href={exportHref} />}
            size="lg"
          >
            <Download className="size-4" />
            Export CSV
          </Button>
          <Button
            nativeButton={false}
            render={<Link href="/dashboard/kk/new" />}
            size="lg"
          >
            <Plus className="size-4" />
            Tambah KK
          </Button>
        </div>
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
        {paginatedHouseholds.length === 0 ? (
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
          paginatedHouseholds.map((household) => {
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
                        <p className="text-muted-foreground text-xs">
                          Telepon KK: {household.phone ?? "Belum diisi"}
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

      {totalItems > 0 ? (
        <section className="bg-background/90 flex flex-col gap-3 rounded-2xl border p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            Menampilkan {startIndex + 1}-
            {Math.min(startIndex + PAGE_SIZE, totalItems)} dari {totalItems}{" "}
            data KK.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={buildPageHref(currentPage - 1)} />}
              disabled={currentPage <= 1}
            >
              Sebelumnya
            </Button>

            {visiblePages.map((page, index) => {
              const previousPage = visiblePages[index - 1];
              const shouldShowGap = previousPage && page - previousPage > 1;

              return (
                <div key={page} className="flex items-center gap-2">
                  {shouldShowGap ? (
                    <span className="text-muted-foreground px-1 text-sm">
                      ...
                    </span>
                  ) : null}
                  <Button
                    nativeButton={false}
                    variant={page === currentPage ? "default" : "outline"}
                    render={<Link href={buildPageHref(page)} />}
                    className="min-w-10"
                  >
                    {page}
                  </Button>
                </div>
              );
            })}

            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={buildPageHref(currentPage + 1)} />}
              disabled={currentPage >= totalPages}
            >
              Berikutnya
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
