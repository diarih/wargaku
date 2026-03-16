import Link from "next/link";
import { notFound } from "next/navigation";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";
import { InitialsAvatar } from "~/app/dashboard/_components/initials-avatar";
import { ResidentForm } from "~/app/dashboard/_components/resident-form";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getInitialsAvatarUrl } from "~/lib/avatar";
import { db } from "~/server/db";
import { getResidentCompleteness } from "~/server/households";

type NewResidentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ onboarding?: string }>;
};

export default async function NewResidentPage({
  params,
  searchParams,
}: NewResidentPageProps) {
  const { id } = await params;
  const { onboarding } = await searchParams;
  const household = await db.household.findUnique({
    where: { id },
    include: {
      residents: {
        orderBy: [{ isKepalaKeluarga: "desc" }, { namaLengkap: "asc" }],
      },
    },
  });

  if (!household) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <section className="bg-background/90 space-y-3 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">KK {household.noKk}</Badge>
          <Badge variant="outline">
            {household.residents.length} anggota tersimpan
          </Badge>
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Tambah Anggota Keluarga
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Tambahkan anggota baru ke KK ini tanpa kembali ke daftar. Gunakan
            simpan berulang agar input keluarga besar lebih cepat.
          </p>
        </div>
        {onboarding === "1" ? (
          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-900">
            Data KK sudah tersimpan. Lanjutkan dengan menambahkan anggota
            keluarga pertama.
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <ResidentForm
          mode="create"
          householdId={household.id}
          householdLabel={household.noKk}
        />

        <Card>
          <CardHeader>
            <CardTitle>Anggota Saat Ini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {household.residents.length === 0 ? (
              <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                Belum ada anggota keluarga. Tambahkan data pertama dari form di
                samping.
              </div>
            ) : (
              household.residents.map((resident) => {
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
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/dashboard/kk/${household.id}`} />}
            >
              Selesai dan buka detail KK
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
