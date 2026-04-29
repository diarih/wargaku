import Link from "next/link";
import { format } from "date-fns";
import { Edit3, FileText } from "lucide-react";

import { CompletenessBadge } from "~/app/dashboard/_components/completeness-badge";
import { DocumentUploader } from "~/app/dashboard/_components/document-uploader";
import { FileDeleteButton } from "~/app/dashboard/_components/file-delete-button";
import { InitialsAvatar } from "~/app/dashboard/_components/initials-avatar";
import { Badge } from "~/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from "~/components/ui/card";
import { getInitialsAvatarUrl } from "~/lib/avatar";

export type ResidentDetailViewProps = {
  resident: {
    id: string;
    namaLengkap: string;
    nik: string;
    hubunganDalamKk: string;
    isActive: boolean;
    isKepalaKeluarga: boolean;
    jenisKelamin: string;
    statusPerkawinan: string | null;
    tempatLahir: string | null;
    tanggalLahir: Date | null;
    agama: string | null;
    pendidikan: string | null;
    pekerjaan: string | null;
    household: {
      id: string;
      noKk: string;
      alamat: string;
      rt: string;
      rw: string;
    };
  };
  completeness: {
    status: "complete" | "warning" | "critical";
    score: number;
    missing: string[];
  };
  files: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    createdAt: Date;
    downloadUrl: string | null;
  }>;
};

const EMPTY_VALUE = "Belum diisi";
const outlineLinkClass =
  "group/button inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-sm font-medium whitespace-nowrap transition-all outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 dark:border-input dark:bg-input/30 dark:hover:bg-input/50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";
const primaryLinkClass =
  "group/button inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-transparent bg-primary px-2.5 text-sm font-medium whitespace-nowrap text-primary-foreground transition-all outline-none select-none hover:bg-primary/80 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

function detailValue(value: string | null) {
  return value?.trim() ? value : EMPTY_VALUE;
}

function birthDetail(place: string | null, date: Date | null) {
  const safePlace = place?.trim();

  if (safePlace && date) {
    return `${safePlace}, ${format(date, "dd MMM yyyy")}`;
  }

  if (safePlace) {
    return safePlace;
  }

  if (date) {
    return format(date, "dd MMM yyyy");
  }

  return EMPTY_VALUE;
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(2)} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(2)} MB`;
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1 border-b py-3 first:pt-0 last:border-b-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <dt className="text-muted-foreground text-sm">{label}</dt>
      <dd className="text-sm font-medium sm:max-w-[60%] sm:text-right">{value}</dd>
    </div>
  );
}

function DetailGroup({
  title,
  description,
  rows,
}: {
  title: string;
  description: string;
  rows: Array<{ label: string; value: string }>;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-base leading-snug font-medium">{title}</h2>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl>
          {rows.map((row) => (
            <DetailRow key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

export function ResidentDetailView({
  resident,
  completeness,
  files,
}: ResidentDetailViewProps) {
  const missingCount = completeness.missing.length;

  return (
    <div className="space-y-6">
      <section className="bg-background rounded-3xl border p-6 shadow-sm lg:p-7">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4 lg:gap-5">
            <InitialsAvatar
              seed={resident.namaLengkap}
              alt={`Avatar ${resident.namaLengkap}`}
              src={getInitialsAvatarUrl(resident.namaLengkap)}
              className="size-16 lg:size-18"
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={resident.isActive ? "secondary" : "outline"}>
                  {resident.isActive ? "Warga Aktif" : "Warga Nonaktif"}
                </Badge>
                {resident.isKepalaKeluarga ? <Badge>Kepala Keluarga</Badge> : null}
                <CompletenessBadge
                  status={completeness.status}
                  score={completeness.score}
                />
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.18em]">
                  Detail Warga
                </p>
                <h1 className="text-3xl font-semibold tracking-tight lg:text-4xl">
                  {resident.namaLengkap}
                </h1>
              </div>

              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    NIK
                  </p>
                  <p className="mt-1 font-medium">{resident.nik}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Peran dalam KK
                  </p>
                  <p className="mt-1 font-medium">{resident.hubunganDalamKk}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide">
                    Kartu Keluarga
                  </p>
                  <p className="mt-1 font-medium">
                    {resident.household.noKk} • {resident.household.alamat}, RT{" "}
                    {resident.household.rt}/RW {resident.household.rw}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row xl:flex-col xl:items-stretch">
            <Link
              href={`/dashboard/kk/${resident.household.id}`}
              className={outlineLinkClass}
            >
              Buka KK
            </Link>
            <Link
              href={`/dashboard/warga/${resident.id}/edit`}
              className={primaryLinkClass}
            >
              <Edit3 className="size-4" />
              Edit warga
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_20rem] xl:items-start">
        <div className="space-y-4">
          <DetailGroup
            title="Identitas Dasar"
            description="Informasi utama warga untuk pencatatan administrasi inti."
            rows={[
              { label: "NIK", value: resident.nik },
              { label: "Jenis kelamin", value: resident.jenisKelamin },
              {
                label: "Tempat, tanggal lahir",
                value: birthDetail(resident.tempatLahir, resident.tanggalLahir),
              },
              {
                label: "Status perkawinan",
                value: detailValue(resident.statusPerkawinan),
              },
            ]}
          />
          <DetailGroup
            title="Data Sosial"
            description="Data sosial warga yang umum dipakai untuk pelaporan dan pelayanan."
            rows={[
              { label: "Agama", value: detailValue(resident.agama) },
              { label: "Pendidikan", value: detailValue(resident.pendidikan) },
              { label: "Pekerjaan", value: detailValue(resident.pekerjaan) },
            ]}
          />
          <DetailGroup
            title="Konteks Keluarga"
            description="Posisi warga dalam KK serta ringkasan alamat keluarga."
            rows={[
              { label: "Peran dalam KK", value: resident.hubunganDalamKk },
              { label: "Nomor KK", value: resident.household.noKk },
              {
                label: "Alamat KK",
                value: `${resident.household.alamat}, RT ${resident.household.rt}/RW ${resident.household.rw}`,
              },
              {
                label: "Status warga",
                value: resident.isActive ? "Warga Aktif" : "Warga Nonaktif",
              },
            ]}
          />
        </div>

        <div className="space-y-4 xl:sticky xl:top-24">
          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-base leading-snug font-medium">
                Kelengkapan Data
              </h2>
              <CardDescription>
                Ringkasan kelengkapan identitas warga yang masih perlu
                ditindaklanjuti.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/40 rounded-2xl border px-4 py-3">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {completeness.score}%
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {missingCount === 0
                        ? "Semua field inti sudah terisi"
                        : `${missingCount} field belum diisi`}
                    </p>
                  </div>
                  <CompletenessBadge
                    status={completeness.status}
                    score={completeness.score}
                  />
                </div>
              </div>

              {missingCount === 0 ? (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-700">
                  Data warga sudah lengkap.
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-muted-foreground text-sm">
                    Field yang masih kosong:
                  </p>
                  <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-sm">
                    {completeness.missing.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <h2 className="text-base leading-snug font-medium">
                Dokumen Warga
              </h2>
              <CardDescription>
                Unggah dan kelola dokumen pendukung yang melekat pada profil
                warga.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DocumentUploader residentId={resident.id} />

              {files.length === 0 ? (
                <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
                  Belum ada dokumen warga.
                </div>
              ) : (
                <div className="space-y-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="rounded-2xl border bg-background/60 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <span className="bg-muted inline-flex size-9 items-center justify-center rounded-xl border">
                            <FileText className="text-primary size-4" />
                          </span>
                          <div>
                            <p className="text-sm font-medium">{file.fileName}</p>
                            <p className="text-muted-foreground text-xs">
                              {formatFileSize(file.size)} - {file.mimeType}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {format(file.createdAt, "dd MMM yyyy")}
                        </Badge>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {file.downloadUrl ? (
                          <a
                            href={file.downloadUrl}
                            aria-label={`Buka dokumen ${file.fileName}`}
                            className={outlineLinkClass}
                          >
                            Buka dokumen
                          </a>
                        ) : null}
                        <FileDeleteButton fileId={file.id} fileName={file.fileName} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
