"use client";

import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

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

type AiSearchResponse = {
  intent: {
    answer: string;
    entityScope: "all" | "household" | "resident" | "document";
    keywords: string[];
    activeOnly?: boolean;
    needsDocuments?: boolean;
    residentMissingFields?: string[];
    householdMissingFields?: string[];
    householdCompletenessStatuses?: string[];
    housingStatuses?: string[];
  };
  results: {
    households: Array<{
      id: string;
      noKk: string;
      kepalaKeluarga: string;
      href: string;
    }>;
    residents: Array<{
      id: string;
      namaLengkap: string;
      nik: string;
      householdNoKk: string;
      href: string;
    }>;
    documents: Array<{
      id: string;
      fileName: string;
      label: string;
      href: string;
    }>;
  };
};

export function AiSearchPanel() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AiSearchResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (query.trim().length < 3) {
      setError("Masukkan pertanyaan minimal 3 karakter.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AiSearchResponse
        | { message?: string }
        | null;

      if (!response.ok) {
        setResult(null);
        setError(
          payload && "message" in payload
            ? (payload.message ?? "Pencarian AI gagal.")
            : "Pencarian AI gagal.",
        );
        return;
      }

      setResult(payload as AiSearchResponse);
    } catch {
      setResult(null);
      setError("Pencarian AI gagal dijalankan.");
    } finally {
      setIsLoading(false);
    }
  }

  const totalResults = result
    ? result.results.households.length +
      result.results.residents.length +
      result.results.documents.length
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary size-4" />
          Pencarian AI
        </CardTitle>
        <CardDescription>
          Tulis pertanyaan seperti operator, lalu AI akan menerjemahkan niat
          pencarian dan menampilkan data yang cocok.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Contoh: warga aktif yang belum isi agama di Cibiru"
            className="h-11"
          />
          <Button type="submit" disabled={isLoading} className="h-11 md:min-w-36">
            {isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            {isLoading ? "Mencari..." : "Cari dengan AI"}
          </Button>
        </form>

        <div className="rounded-2xl border border-dashed bg-muted/10 px-4 py-4 text-sm">
          <p className="font-medium text-foreground">Cheatsheet pencarian AI</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Contoh prompt
              </p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                <li>kk yang kritis</li>
                <li>kk yang perlu dilengkapi di cibiru</li>
                <li>kk aktif yang belum ada dokumen</li>
                <li>data mana yang paling perlu dirapikan</li>
              </ul>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                Yang dipahami AI
              </p>
              <ul className="text-muted-foreground mt-2 list-disc space-y-1 pl-5">
                <li>Status kelengkapan KK: lengkap, perlu dilengkapi, kritis</li>
                <li>Status aktif / nonaktif</li>
                <li>Belum ada dokumen</li>
                <li>Nomor KK, nama, alamat, dan kata kunci lokasi</li>
              </ul>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Catatan: untuk sekarang, status kelengkapan AI hanya berlaku untuk KK.
          </p>
        </div>

        {error ? (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {result ? (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-muted/20 p-4">
              <p className="text-sm font-medium">Jawaban AI</p>
              <p className="text-muted-foreground mt-1 text-sm">
                {result.intent.answer}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">Scope: {result.intent.entityScope}</Badge>
              {result.intent.activeOnly ? (
                <Badge variant="outline">Aktif saja</Badge>
              ) : null}
              {result.intent.needsDocuments ? (
                <Badge variant="outline">Butuh dokumen</Badge>
              ) : null}
              {result.intent.keywords.map((keyword) => (
                <Badge key={keyword} variant="secondary">
                  {keyword}
                </Badge>
              ))}
              {result.intent.residentMissingFields?.map((field) => (
                <Badge key={`resident-${field}`} variant="outline">
                  Warga: {field}
                </Badge>
              ))}
              {result.intent.householdMissingFields?.map((field) => (
                <Badge key={`household-${field}`} variant="outline">
                  KK: {field}
                </Badge>
              ))}
              {result.intent.householdCompletenessStatuses?.map((status) => (
                <Badge key={`kk-status-${status}`} variant="outline">
                  Kelengkapan KK: {status}
                </Badge>
              ))}
              {result.intent.housingStatuses?.map((status) => (
                <Badge key={status} variant="outline">
                  {status}
                </Badge>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>KK</CardTitle>
                  <CardDescription>
                    {result.results.households.length} hasil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.results.households.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Tidak ada KK yang cocok.
                    </p>
                  ) : (
                    result.results.households.map((household) => (
                      <Link
                        key={household.id}
                        href={household.href}
                        className="block rounded-xl border p-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <p className="font-medium">KK {household.noKk}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {household.kepalaKeluarga}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Warga</CardTitle>
                  <CardDescription>
                    {result.results.residents.length} hasil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.results.residents.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Tidak ada warga yang cocok.
                    </p>
                  ) : (
                    result.results.residents.map((resident) => (
                      <Link
                        key={resident.id}
                        href={resident.href}
                        className="block rounded-xl border p-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <p className="font-medium">{resident.namaLengkap}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          NIK {resident.nik} - KK {resident.householdNoKk}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle>Dokumen</CardTitle>
                  <CardDescription>
                    {result.results.documents.length} hasil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.results.documents.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      Tidak ada dokumen yang cocok.
                    </p>
                  ) : (
                    result.results.documents.map((document) => (
                      <Link
                        key={document.id}
                        href={document.href}
                        className="block rounded-xl border p-3 text-sm transition-colors hover:bg-muted/40"
                      >
                        <p className="font-medium break-all">{document.fileName}</p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          {document.label}
                        </p>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {totalResults === 0 ? (
              <div className="text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-sm">
                AI memahami permintaan Anda, tetapi belum menemukan data yang
                cocok.
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
