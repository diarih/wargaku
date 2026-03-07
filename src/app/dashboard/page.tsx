import Link from "next/link";
import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowRight,
  FileUp,
  Home,
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

  const [householdCount, residentCount, newThisMonth, incompleteCount, latest] =
    await Promise.all([
      db.household.count(),
      db.resident.count(),
      db.resident.count({
        where: { createdAt: { gte: monthStart } },
      }),
      db.resident.count({
        where: {
          OR: [{ phone: null }, { pekerjaan: null }, { hubunganDalamKk: "" }],
        },
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
                href="/dashboard/kk"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <Users className="size-4" />
                <span>Lihat data KK</span>
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
                <span>Tambah anggota</span>
              </Link>
              <Link
                href="/dashboard/pencarian"
                className="bg-background hover:bg-muted inline-flex h-auto items-center justify-start gap-3 rounded-lg border px-4 py-4 text-sm font-medium transition-colors"
              >
                <FileUp className="size-4" />
                <span>Upload berkas</span>
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
