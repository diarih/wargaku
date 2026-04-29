import Link from "next/link";
import { FileText, Search, UserRound, Users } from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { buildAdminSearchResults } from "~/server/admin-search";
import { db } from "~/server/db";

type AdminSearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function AdminSearchPage({
  searchParams,
}: AdminSearchPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";

  const [households, residents, documents] = query
    ? await Promise.all([
        db.household.findMany({
          where: {
            OR: [
              { noKk: { contains: query, mode: "insensitive" } },
              { kepalaKeluarga: { contains: query, mode: "insensitive" } },
              { alamat: { contains: query, mode: "insensitive" } },
              { phone: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 8,
          select: {
            id: true,
            noKk: true,
            kepalaKeluarga: true,
            alamat: true,
            phone: true,
            statusAktif: true,
          },
        }),
        db.resident.findMany({
          where: {
            OR: [
              { namaLengkap: { contains: query, mode: "insensitive" } },
              { nik: { contains: query, mode: "insensitive" } },
              { hubunganDalamKk: { contains: query, mode: "insensitive" } },
              {
                household: {
                  noKk: { contains: query, mode: "insensitive" },
                },
              },
            ],
          },
          orderBy: { updatedAt: "desc" },
          take: 10,
          select: {
            id: true,
            householdId: true,
            namaLengkap: true,
            nik: true,
            hubunganDalamKk: true,
            isActive: true,
            household: {
              select: {
                noKk: true,
              },
            },
          },
        }),
        db.fileAsset.findMany({
          where: {
            OR: [
              { fileName: { contains: query, mode: "insensitive" } },
              {
                household: { noKk: { contains: query, mode: "insensitive" } },
              },
              {
                resident: {
                  namaLengkap: { contains: query, mode: "insensitive" },
                },
              },
            ],
          },
          orderBy: { createdAt: "desc" },
          take: 10,
          select: {
            id: true,
            fileName: true,
            householdId: true,
            residentId: true,
            createdAt: true,
            household: {
              select: {
                noKk: true,
              },
            },
            resident: {
              select: {
                namaLengkap: true,
              },
            },
          },
        }),
      ])
    : [[], [], []];

  const results = buildAdminSearchResults({
    query,
    households,
    residents: residents.map((resident) => ({
      id: resident.id,
      householdId: resident.householdId,
      householdNoKk: resident.household.noKk,
      namaLengkap: resident.namaLengkap,
      nik: resident.nik,
      hubunganDalamKk: resident.hubunganDalamKk,
      isActive: resident.isActive,
    })),
    documents: documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      householdId: document.householdId,
      householdNoKk: document.household?.noKk ?? null,
      residentId: document.residentId,
      residentName: document.resident?.namaLengkap ?? null,
      createdAt: document.createdAt,
    })),
  });

  const totalResults =
    results.households.length +
    results.residents.length +
    results.documents.length;

  return (
    <div className="space-y-6">
      <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Cari Data Admin</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
          Cari KK, warga, atau dokumen dari satu tempat tanpa pindah menu.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pencarian Cepat</CardTitle>
          <CardDescription>
            Mendukung nomor KK, nama warga, NIK, alamat, telepon, dan nama
            dokumen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Cari nomor KK, nama warga, NIK, alamat, atau dokumen"
                className="h-11 pl-9"
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {!query ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Mulai dengan kata kunci</CardTitle>
            <CardDescription>
              Masukkan kata kunci di atas untuk mencari data admin lintas KK,
              warga, dan dokumen.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {query ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>KK</CardTitle>
                  <CardDescription>
                    {results.households.length} hasil
                  </CardDescription>
                </div>
                <Users className="text-primary size-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.households.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada KK yang cocok.
                </p>
              ) : (
                results.households.map((household) => (
                  <Link
                    key={household.id}
                    href={household.href}
                    className="bg-muted/30 block rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">KK {household.noKk}</p>
                      <Badge
                        variant={household.statusAktif ? "secondary" : "outline"}
                      >
                        {household.statusAktif ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm">{household.kepalaKeluarga}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {household.alamat}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Warga</CardTitle>
                  <CardDescription>{results.residents.length} hasil</CardDescription>
                </div>
                <UserRound className="text-primary size-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.residents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada warga yang cocok.
                </p>
              ) : (
                results.residents.map((resident) => (
                  <Link
                    key={resident.id}
                    href={resident.href}
                    className="bg-muted/30 block rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{resident.namaLengkap}</p>
                      <Badge variant={resident.isActive ? "secondary" : "outline"}>
                        {resident.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      NIK {resident.nik} - KK {resident.householdNoKk}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Dokumen</CardTitle>
                  <CardDescription>{results.documents.length} hasil</CardDescription>
                </div>
                <FileText className="text-primary size-4" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {results.documents.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Tidak ada dokumen yang cocok.
                </p>
              ) : (
                results.documents.map((document) => (
                  <Link
                    key={document.id}
                    href={document.href}
                    className="bg-muted/30 block rounded-xl border p-3 transition-colors hover:bg-muted/50"
                  >
                    <p className="text-sm font-semibold">{document.fileName}</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {document.residentName ??
                        (document.householdNoKk
                          ? `KK ${document.householdNoKk}`
                          : "Dokumen tidak tertaut")}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}

      {query && totalResults === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Tidak ada hasil</CardTitle>
            <CardDescription>
              Coba kata kunci lain untuk menemukan KK, warga, atau dokumen yang
              Anda cari.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
