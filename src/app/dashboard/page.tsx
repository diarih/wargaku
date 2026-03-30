import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Cake,
  Home,
  PencilLine,
  Search,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";

import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { FadeIn } from "~/components/animated/fade-in";
import { db } from "~/server/db";
import { getHouseholdCompleteness } from "~/server/households";

const ageBuckets = [
  { label: "Balita", min: 0, max: 5 },
  { label: "Anak", min: 6, max: 12 },
  { label: "Remaja", min: 13, max: 17 },
  { label: "Dewasa", min: 18, max: 59 },
  { label: "Lansia", min: 60, max: Infinity },
] as const;

function getAgeInYears(date: Date | null) {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getAgeDistribution(residents: { tanggalLahir: Date | null }[]) {
  const counts = ageBuckets.map((bucket) => ({ ...bucket, total: 0 }));
  let unknown = 0;

  for (const resident of residents) {
    const age = getAgeInYears(resident.tanggalLahir);

    if (age === null) {
      unknown += 1;
      continue;
    }

    const bucket = counts.find((item) => age >= item.min && age <= item.max);

    if (bucket) {
      bucket.total += 1;
    } else {
      unknown += 1;
    }
  }

  return { counts, unknown };
}

function getLivingStatusSummary(residents: { statusTinggal: string | null }[]) {
  let rent = 0;
  let nonRent = 0;
  let unknown = 0;

  for (const resident of residents) {
    const value = resident.statusTinggal?.trim().toLowerCase();

    if (!value) {
      unknown += 1;
      continue;
    }

    if (
      value.includes("sewa") ||
      value.includes("kontrak") ||
      value.includes("kost")
    ) {
      rent += 1;
    } else {
      nonRent += 1;
    }
  }

  return { rent, nonRent, unknown };
}

function getPercent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

const cards = [
  {
    title: "Total Kartu Keluarga",
    key: "householdCount",
    suffix: "KK",
    icon: Home,
    accent: "from-cyan-400/30 to-sky-300/10",
  },
  {
    title: "Total Warga",
    key: "residentCount",
    suffix: "Orang",
    icon: UsersRound,
    accent: "from-emerald-400/30 to-lime-300/10",
  },
  {
    title: "Data Baru Bulan Ini",
    key: "newThisMonth",
    suffix: "Data",
    icon: UserPlus,
    accent: "from-blue-400/30 to-indigo-300/10",
  },
  {
    title: "Data Perlu Dilengkapi",
    key: "incompleteCount",
    suffix: "Data",
    icon: AlertTriangle,
    accent: "from-amber-400/35 to-orange-300/10",
  },
] as const;

export default async function DashboardPage() {
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [households, residentCount, newThisMonth, latest] = await Promise.all([
    db.household.findMany({
      include: {
        residents: {
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
      },
    }),
    db.resident.count(),
    db.resident.count({
      where: { createdAt: { gte: monthStart } },
    }),
    db.resident.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        household: {
          select: {
            noKk: true,
          },
        },
      },
    }),
  ]);

  const householdCount = households.length;
  const residents = households.flatMap((household) => household.residents);
  const incompleteCount = households.filter((household) => {
    return getHouseholdCompleteness(household).status !== "complete";
  }).length;
  const ageDistribution = getAgeDistribution(residents);
  const livingStatus = getLivingStatusSummary(residents);

  const stats = {
    householdCount,
    residentCount,
    newThisMonth,
    incompleteCount,
  };

  return (
    <div className="space-y-6">
      <FadeIn>
        <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
          <p className="text-muted-foreground text-sm font-medium">Dashboard</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
            Selamat datang di pusat pendataan warga.
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm">
            Pantau data keluarga dan anggota secara real-time, lalu lanjutkan
            aksi harian dari menu cepat di bawah ini.
          </p>
        </section>
      </FadeIn>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 xl:gap-6">
        {cards.map((item, index) => (
          <FadeIn key={item.title} delay={0.05 + index * 0.05}>
            <Card className="bg-background/95 relative overflow-hidden border-white/60 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
              <div
                className={`absolute -top-8 -right-6 h-24 w-24 rounded-full bg-gradient-to-br ${item.accent}`}
              />
              <CardHeader className="pb-1">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <CardDescription className="text-sm font-medium">
                    {item.title}
                  </CardDescription>
                  <span className="bg-muted/80 inline-flex size-8 items-center justify-center rounded-lg border">
                    <item.icon className="text-primary size-4" />
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-3xl font-semibold tracking-tight">
                  {stats[item.key].toLocaleString("id-ID")}
                  <span className="text-muted-foreground text-sm font-normal">
                    {item.suffix}
                  </span>
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Update otomatis saat data berubah
                </p>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <FadeIn delay={0.18}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Distribusi Usia</CardTitle>
                  <CardDescription>
                    Sebaran usia warga berdasarkan tanggal lahir yang sudah
                    terisi.
                  </CardDescription>
                </div>
                <span className="bg-muted/80 inline-flex size-9 items-center justify-center rounded-xl border">
                  <Cake className="text-primary size-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {ageDistribution.counts.map((bucket) => (
                <div key={bucket.label} className="space-y-1">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{bucket.label}</span>
                    <span className="text-muted-foreground">
                      {bucket.total} orang (
                      {getPercent(bucket.total, residentCount)}%)
                    </span>
                  </div>
                  <div className="bg-muted h-2 rounded-full">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-lime-300"
                      style={{
                        width: `${getPercent(bucket.total, residentCount)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}

              <div className="flex items-center justify-between rounded-xl border border-amber-500/15 bg-amber-500/5 px-4 py-3 text-sm">
                <span className="font-medium text-amber-900">Belum diisi</span>
                <span className="text-amber-800">
                  {ageDistribution.unknown} orang (
                  {getPercent(ageDistribution.unknown, residentCount)}%)
                </span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.24}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Status Tinggal</CardTitle>
                  <CardDescription>
                    Ringkasan warga yang tinggal dengan status kontrak atau
                    sewa.
                  </CardDescription>
                </div>
                <span className="bg-muted/80 inline-flex size-9 items-center justify-center rounded-xl border">
                  <BedDouble className="text-primary size-4" />
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  label: "Kontrak / Sewa",
                  value: livingStatus.rent,
                  className: "border-cyan-500/15 bg-cyan-500/5 text-cyan-900",
                },
                {
                  label: "Bukan Sewa",
                  value: livingStatus.nonRent,
                  className: "border-lime-500/15 bg-lime-500/5 text-lime-900",
                },
                {
                  label: "Belum diisi",
                  value: livingStatus.unknown,
                  className:
                    "border-amber-500/15 bg-amber-500/5 text-amber-900",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm ${item.className}`}
                >
                  <span className="font-medium">{item.label}</span>
                  <span>
                    {item.value} orang ({getPercent(item.value, residentCount)}
                    %)
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </FadeIn>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <FadeIn delay={0.22}>
          <Card>
            <CardHeader>
              <CardTitle>Aksi Cepat</CardTitle>
              <CardDescription>
                Jalankan alur kerja utama tanpa pindah banyak halaman.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard/kk/new"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <Users className="size-4" />
                <span>Tambah KK baru</span>
              </Link>
              <Link
                href="/dashboard/pencarian"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <Search className="size-4" />
                <span>Cari NIK / No KK</span>
              </Link>
              <Link
                href="/dashboard/kk"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <UserPlus className="size-4" />
                <span>Kelola anggota</span>
              </Link>
              <Link
                href="/dashboard/kk"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <PencilLine className="size-4" />
                <span>Rapikan data draft</span>
              </Link>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.3}>
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>
                Perubahan data terbaru oleh petugas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {latest.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                  Belum ada aktivitas data.
                </div>
              ) : (
                latest.map((item: (typeof latest)[number]) => (
                  <div
                    key={item.id}
                    className="bg-muted/40 flex items-center justify-between rounded-xl border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{item.namaLengkap}</p>
                      <p className="text-muted-foreground text-xs">
                        NIK {item.nik} • KK {item.household.noKk}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {format(item.updatedAt, "dd MMM")}
                    </Badge>
                  </div>
                ))
              )}
              <Link
                href="/dashboard/kk"
                className="hover:bg-muted inline-flex h-8 w-full items-center justify-between rounded-lg px-2.5 text-sm font-medium transition-colors"
              >
                Kelola data lengkap
                <ArrowRight className="size-4" />
              </Link>
            </CardContent>
          </Card>
        </FadeIn>
      </section>
    </div>
  );
}
