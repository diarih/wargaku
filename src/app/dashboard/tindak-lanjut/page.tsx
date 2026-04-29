import Link from "next/link";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  buildCompletenessQueue,
  type HouseholdQueueItem,
  type ResidentQueueItem,
} from "~/server/completeness";
import { db } from "~/server/db";

type FollowUpPageProps = {
  searchParams: Promise<{
    severity?: "all" | "warning" | "critical";
    scope?: "all" | "households" | "residents";
    active?: "all" | "active" | "inactive";
  }>;
};

export default async function FollowUpPage({
  searchParams,
}: FollowUpPageProps) {
  const params = await searchParams;
  const severity = params.severity ?? "all";
  const scope = params.scope ?? "all";
  const active = params.active ?? "all";

  const households = await db.household.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
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
      phone: true,
      statusTempatTinggal: true,
      statusAktif: true,
      updatedAt: true,
      residents: {
        select: {
          id: true,
          namaLengkap: true,
          nik: true,
          jenisKelamin: true,
          tempatLahir: true,
          tanggalLahir: true,
          hubunganDalamKk: true,
          agama: true,
          pendidikan: true,
          pekerjaan: true,
          statusPerkawinan: true,
          isKepalaKeluarga: true,
          isActive: true,
          updatedAt: true,
        },
      },
    },
  });

  const queue = buildCompletenessQueue(households);
  const filteredHouseholds = queue.households.filter(
    (item: HouseholdQueueItem) => {
      if (severity !== "all" && item.status !== severity) return false;
      if (active === "active" && !item.isActive) return false;
      if (active === "inactive" && item.isActive) return false;
      return true;
    },
  );
  const filteredResidents = queue.residents.filter(
    (item: ResidentQueueItem) => {
      if (severity !== "all" && item.status !== severity) return false;
      if (active === "active" && !item.isActive) return false;
      if (active === "inactive" && item.isActive) return false;
      return true;
    },
  );

  const visibleHouseholds = scope === "residents" ? [] : filteredHouseholds;
  const visibleResidents = scope === "households" ? [] : filteredResidents;
  const totalVisible = visibleHouseholds.length + visibleResidents.length;

  return (
    <div className="space-y-6">
      <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">
          Tindak Lanjut Data
        </h1>
        <p className="text-muted-foreground mt-1 max-w-3xl text-sm">
          Fokuskan pekerjaan admin pada data KK dan warga yang masih perlu
          dirapikan.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filter Antrian</CardTitle>
          <CardDescription>
            Tampilkan hanya item yang perlu tindakan berdasarkan tingkat risiko
            dan status aktif.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
            <select
              name="severity"
              defaultValue={severity}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua tingkat</option>
              <option value="critical">Kritis</option>
              <option value="warning">Perlu dilengkapi</option>
            </select>

            <select
              name="scope"
              defaultValue={scope}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">KK dan warga</option>
              <option value="households">KK saja</option>
              <option value="residents">Warga saja</option>
            </select>

            <select
              name="active"
              defaultValue={active}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>

            <Button type="submit" className="h-10">
              Terapkan
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>KK Perlu Dirapikan</CardTitle>
            <CardDescription>{visibleHouseholds.length} item terlihat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleHouseholds.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Tidak ada KK yang cocok dengan filter saat ini.
              </p>
            ) : (
              visibleHouseholds.map((item: HouseholdQueueItem) => (
                <div
                  key={item.id}
                  className="bg-muted/30 space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">KK {item.noKk}</p>
                      <p className="text-muted-foreground text-xs">
                        {item.label}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.isActive ? "secondary" : "outline"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <CompletenessBadge status={item.status} score={item.score} />
                    </div>
                  </div>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                    {item.missing.slice(0, 3).map((missing: string) => (
                      <li key={missing}>{missing}</li>
                    ))}
                  </ul>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link href={item.href} />}
                  >
                    Buka KK
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Warga Perlu Dirapikan</CardTitle>
            <CardDescription>{visibleResidents.length} item terlihat</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {visibleResidents.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Tidak ada warga yang cocok dengan filter saat ini.
              </p>
            ) : (
              visibleResidents.map((item: ResidentQueueItem) => (
                <div
                  key={item.id}
                  className="bg-muted/30 space-y-3 rounded-2xl border p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className="text-muted-foreground text-xs">
                        KK {item.householdNoKk}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={item.isActive ? "secondary" : "outline"}>
                        {item.isActive ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <CompletenessBadge status={item.status} score={item.score} />
                    </div>
                  </div>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                    {item.missing.slice(0, 3).map((missing: string) => (
                      <li key={missing}>{missing}</li>
                    ))}
                  </ul>
                  <Button
                    nativeButton={false}
                    variant="outline"
                    render={<Link href={item.href} />}
                  >
                    Buka Warga
                  </Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      {totalVisible === 0 ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Antrian kosong</CardTitle>
            <CardDescription>
              Tidak ada item tindak lanjut yang cocok dengan kombinasi filter
              saat ini.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}
    </div>
  );
}
