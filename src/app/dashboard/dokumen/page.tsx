import Link from "next/link";
import { format } from "date-fns";
import { Download, FileText, FolderOpen, Search } from "lucide-react";

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
import { env } from "~/env";
import { db } from "~/server/db";
import { supabaseAdmin } from "~/server/supabase";

type DocumentsPageProps = {
  searchParams: Promise<{
    q?: string;
    type?: "all" | "household" | "resident";
  }>;
};

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const type = params.type ?? "all";

  const files = await db.fileAsset.findMany({
    where: {
      ...(query
        ? {
            fileName: { contains: query, mode: "insensitive" },
          }
        : {}),
      ...(type === "household"
        ? { householdId: { not: null } }
        : type === "resident"
          ? { residentId: { not: null } }
          : {}),
    },
    include: {
      household: {
        select: {
          id: true,
          noKk: true,
        },
      },
      resident: {
        select: {
          id: true,
          namaLengkap: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const filesWithUrl = await Promise.all(
    files.map(async (file) => {
      const signed = await supabaseAdmin.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .createSignedUrl(file.path, 60 * 30);

      return {
        ...file,
        downloadUrl: signed.data?.signedUrl ?? null,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <section className="bg-background/90 rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight">Dokumen</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Kelola seluruh dokumen KK dan warga dari satu halaman agar lebih cepat
          dicari dan dibuka kembali.
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Filter Dokumen</CardTitle>
          <CardDescription>
            Cari berdasarkan nama file atau tipe dokumen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                name="q"
                defaultValue={query}
                placeholder="Cari nama dokumen"
                className="h-10 pl-9"
              />
            </div>
            <select
              name="type"
              defaultValue={type}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            >
              <option value="all">Semua dokumen</option>
              <option value="household">Dokumen KK</option>
              <option value="resident">Dokumen Warga</option>
            </select>
            <Button type="submit" className="h-10">
              Terapkan
            </Button>
          </form>
        </CardContent>
      </Card>

      <section className="grid gap-4">
        {filesWithUrl.length === 0 ? (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle>Belum ada dokumen</CardTitle>
              <CardDescription>
                Tidak ada dokumen yang cocok dengan filter saat ini.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          filesWithUrl.map((file) => (
            <Card key={file.id}>
              <CardContent className="flex flex-col gap-4 py-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span className="bg-background inline-flex size-10 items-center justify-center rounded-xl border">
                    <FileText className="text-primary size-4" />
                  </span>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{file.fileName}</p>
                      <Badge variant="outline">
                        {file.householdId ? "Dokumen KK" : "Dokumen Warga"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {file.mimeType} - {(file.size / 1024 / 1024).toFixed(2)}{" "}
                      MB - {format(file.createdAt, "dd MMM yyyy")}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {file.household ? `KK ${file.household.noKk}` : null}
                      {file.household && file.resident ? " - " : null}
                      {file.resident ? file.resident.namaLengkap : null}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  {file.downloadUrl ? (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={<a href={file.downloadUrl}>Unduh</a>}
                    >
                      <Download className="size-4" />
                      Unduh
                    </Button>
                  ) : null}
                  {file.household ? (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link href={`/dashboard/kk/${file.household.id}`} />
                      }
                    >
                      <FolderOpen className="size-4" />
                      Buka KK
                    </Button>
                  ) : null}
                  {file.resident ? (
                    <Button
                      nativeButton={false}
                      variant="outline"
                      render={
                        <Link
                          href={`/dashboard/warga/${file.resident.id}/edit`}
                        />
                      }
                    >
                      Buka Warga
                    </Button>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </section>
    </div>
  );
}
