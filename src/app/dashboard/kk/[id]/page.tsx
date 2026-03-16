import Link from "next/link";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  CalendarDays,
  Edit3,
  FileText,
  Plus,
  TriangleAlert,
} from "lucide-react";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";
import { DocumentUploader } from "~/app/dashboard/_components/document-uploader";
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
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  getHouseholdCompleteness,
  getResidentCompleteness,
} from "~/server/households";
import { supabaseAdmin } from "~/server/supabase";
import { env } from "~/env";

type HouseholdDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function HouseholdDetailPage({
  params,
}: HouseholdDetailPageProps) {
  const { id } = await params;

  const household = await db.household.findUnique({
    where: { id },
    include: {
      residents: {
        orderBy: [{ isKepalaKeluarga: "desc" }, { namaLengkap: "asc" }],
      },
      files: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!household) {
    notFound();
  }

  const completeness = getHouseholdCompleteness(household);
  const head = completeness.headOfFamily;
  const filesWithUrl = await Promise.all(
    household.files.map(async (file) => {
      const signed = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(file.path, 60 * 30);

      return {
        ...file,
        downloadUrl: signed.data?.signedUrl ?? null,
      };
    }),
  );

  async function deleteFileAsset(formData: FormData) {
    "use server";

    const session = await auth();

    if (!session?.user) {
      return;
    }

    const fileId = formData.get("fileId");

    if (typeof fileId !== "string") {
      return;
    }

    const file = await db.fileAsset.findUnique({ where: { id: fileId } });

    if (!file) {
      return;
    }

    await supabaseAdmin.storage.from(file.bucket).remove([file.path]);
    await db.fileAsset.delete({ where: { id: fileId } });
    revalidatePath(`/dashboard/kk/${id}`);
  }

  return (
    <div className="space-y-6">
      <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <InitialsAvatar
              seed={head?.namaLengkap ?? "KK"}
              alt={`Avatar ${head?.namaLengkap ?? household.noKk}`}
              src={getInitialsAvatarUrl(head?.namaLengkap ?? household.noKk)}
              className="size-16"
            />

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant={household.statusAktif ? "secondary" : "outline"}
                >
                  {household.statusAktif ? "KK Aktif" : "KK Nonaktif"}
                </Badge>
                <CompletenessBadge
                  status={completeness.status}
                  score={completeness.score}
                />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">
                KK {household.noKk}
              </h1>
              <p className="text-muted-foreground text-sm">
                {head?.namaLengkap ?? "Kepala keluarga belum dipilih"} -{" "}
                {household.alamat}, RT {household.rt}/RW {household.rw}
              </p>
              <p className="text-muted-foreground text-sm">
                {household.kelurahan}, {household.kecamatan}, {household.kota},{" "}
                {household.provinsi}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/dashboard/kk/${household.id}/edit`} />}
            >
              <Edit3 className="size-4" />
              Edit KK
            </Button>
            <Button
              nativeButton={false}
              variant="outline"
              render={<Link href={`/dashboard/kk/${household.id}/warga/new`} />}
            >
              <Plus className="size-4" />
              Tambah anggota
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>Daftar Anggota Keluarga</CardTitle>
            <CardDescription>
              Tandai satu anggota sebagai kepala keluarga untuk menyelesaikan
              identitas KK.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {household.residents.length === 0 ? (
              <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                Belum ada anggota tercatat. Tambahkan anggota pertama untuk
                mulai melengkapi data KK.
              </div>
            ) : (
              household.residents.map((resident) => {
                const residentCompleteness = getResidentCompleteness(resident);

                return (
                  <div
                    key={resident.id}
                    className="bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <InitialsAvatar
                        seed={resident.namaLengkap}
                        alt={`Avatar ${resident.namaLengkap}`}
                        src={getInitialsAvatarUrl(resident.namaLengkap)}
                        className="size-11"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">
                            {resident.namaLengkap}
                          </p>
                          {resident.isKepalaKeluarga ? (
                            <Badge>Kepala Keluarga</Badge>
                          ) : null}
                          <Badge
                            variant={
                              resident.isActive ? "secondary" : "outline"
                            }
                          >
                            {resident.isActive ? "Aktif" : "Tidak aktif"}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground text-sm">
                          NIK {resident.nik} - {resident.hubunganDalamKk}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {resident.tempatLahir ?? "Tempat lahir belum diisi"}
                          {resident.tanggalLahir
                            ? `, ${format(resident.tanggalLahir, "dd MMM yyyy")}`
                            : " - tanggal lahir belum diisi"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      <CompletenessBadge
                        status={residentCompleteness.status}
                        score={residentCompleteness.score}
                      />
                      <Button
                        nativeButton={false}
                        variant="outline"
                        render={
                          <Link href={`/dashboard/warga/${resident.id}/edit`} />
                        }
                      >
                        Edit anggota
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kelengkapan Data</CardTitle>
              <CardDescription>
                Simpan sebagai draft diperbolehkan, tetapi item di bawah perlu
                dirapikan agar siap dipakai operasional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-secondary/40 rounded-2xl border p-4">
                <p className="text-3xl font-semibold tracking-tight">
                  {completeness.score}%
                </p>
                <p className="text-muted-foreground mt-1 text-sm">
                  Skor dihitung dari kelengkapan alamat, data anggota, dan
                  penetapan kepala keluarga.
                </p>
              </div>

              {completeness.missing.length === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-700">
                  Data KK sudah lengkap dan siap digunakan.
                </div>
              ) : (
                <div className="space-y-2">
                  {completeness.missing.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-800"
                    >
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              )}

              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href={`/dashboard/kk/${household.id}/edit`} />}
              >
                Rapikan data KK
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dokumen KK</CardTitle>
              <CardDescription>
                Upload scan KK atau lampiran pendukung. Dokumen profil tetap
                terpisah dari avatar initials.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUploader householdId={household.id} />

              {filesWithUrl.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed p-4 text-sm">
                  Belum ada berkas terunggah.
                </div>
              ) : (
                <div className="space-y-3">
                  {filesWithUrl.map((file) => (
                    <div
                      key={file.id}
                      className="bg-muted/30 flex flex-col gap-3 rounded-2xl border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="bg-background inline-flex size-10 items-center justify-center rounded-xl border">
                            <FileText className="text-primary size-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium">
                              {file.fileName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {(file.size / 1024 / 1024).toFixed(2)} MB -{" "}
                              {file.mimeType}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {format(file.createdAt, "dd MMM yyyy")}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {file.downloadUrl ? (
                          <Button
                            nativeButton={false}
                            variant="outline"
                            render={<a href={file.downloadUrl}>Unduh</a>}
                          >
                            <CalendarDays className="size-4" />
                            Buka dokumen
                          </Button>
                        ) : null}
                        <form action={deleteFileAsset}>
                          <input type="hidden" name="fileId" value={file.id} />
                          <Button type="submit" variant="destructive">
                            Hapus
                          </Button>
                        </form>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Cepat</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs">Total anggota</p>
                <p className="mt-1 text-2xl font-semibold">
                  {household.residents.length}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs">
                  Dokumen terunggah
                </p>
                <p className="mt-1 text-2xl font-semibold">
                  {household.files.length}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs">Kepala keluarga</p>
                <p className="mt-1 text-sm font-semibold">
                  {head?.namaLengkap ?? "Belum dipilih"}
                </p>
              </div>
              <div className="rounded-2xl border p-4">
                <p className="text-muted-foreground text-xs">Status</p>
                <p className="mt-1 text-sm font-semibold">
                  {household.statusAktif ? "Digunakan operasional" : "Nonaktif"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
