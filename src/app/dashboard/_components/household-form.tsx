"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormFieldError } from "~/app/dashboard/_components/form-field-error";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  householdPayloadSchema,
  type HouseholdFormValues,
  type HouseholdPayload,
} from "~/server/households";

type HouseholdFormProps = {
  mode: "create" | "edit";
  householdId?: string;
  initialValues?: Partial<HouseholdPayload>;
};

const defaultValues: HouseholdFormValues = {
  noKk: "",
  alamat: "",
  rt: "",
  rw: "",
  kelurahan: "",
  kecamatan: "",
  kota: "",
  provinsi: "",
  kodePos: "",
  statusAktif: true,
};

export function HouseholdForm({
  mode,
  householdId,
  initialValues,
}: HouseholdFormProps) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<HouseholdFormValues>({
    resolver: zodResolver(householdPayloadSchema),
    defaultValues: {
      ...defaultValues,
      ...initialValues,
    },
  });

  useEffect(() => {
    reset({
      ...defaultValues,
      ...initialValues,
    });
  }, [initialValues, reset]);

  const onSubmit = handleSubmit(async (values) => {
    const endpoint =
      mode === "create" ? "/api/households" : `/api/households/${householdId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      redirectTo?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.message ?? "Tidak dapat menyimpan data KK.");
      return;
    }

    toast.success(
      mode === "create"
        ? "Data KK berhasil dibuat. Lanjutkan dengan menambahkan anggota keluarga."
        : "Data KK berhasil diperbarui.",
    );
    router.push(payload?.redirectTo ?? "/dashboard/kk");
    router.refresh();
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Identitas KK</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="noKk">Nomor KK</Label>
            <Input
              id="noKk"
              placeholder="Masukkan 16 digit nomor KK"
              maxLength={16}
              className="h-10"
              aria-invalid={!!errors.noKk}
              {...register("noKk")}
            />
            <FormFieldError message={errors.noKk?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rt">RT</Label>
            <Input
              id="rt"
              className="h-10"
              aria-invalid={!!errors.rt}
              {...register("rt")}
            />
            <FormFieldError message={errors.rt?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rw">RW</Label>
            <Input
              id="rw"
              className="h-10"
              aria-invalid={!!errors.rw}
              {...register("rw")}
            />
            <FormFieldError message={errors.rw?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="kodePos">Kode Pos</Label>
            <Input
              id="kodePos"
              className="h-10"
              placeholder="Opsional, 5 digit"
              maxLength={5}
              aria-invalid={!!errors.kodePos}
              {...register("kodePos")}
            />
            <FormFieldError message={errors.kodePos?.message} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="alamat">Alamat</Label>
            <textarea
              id="alamat"
              rows={4}
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 min-h-28 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3"
              placeholder="Contoh: Jl. Melati No. 17"
              aria-invalid={!!errors.alamat}
              {...register("alamat")}
            />
            <FormFieldError message={errors.alamat?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wilayah Administratif</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            { id: "kelurahan", label: "Kelurahan" },
            { id: "kecamatan", label: "Kecamatan" },
            { id: "kota", label: "Kota / Kabupaten" },
            { id: "provinsi", label: "Provinsi" },
          ].map((field) => {
            const name = field.id as keyof HouseholdPayload;

            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  className="h-10"
                  aria-invalid={!!errors[name]}
                  {...register(name)}
                />
                <FormFieldError message={errors[name]?.message} />
              </div>
            );
          })}

          <label className="bg-secondary/40 flex items-center gap-3 rounded-2xl border p-4 md:col-span-2">
            <input
              type="checkbox"
              className="border-input text-primary size-4 rounded"
              {...register("statusAktif")}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">Data KK aktif</span>
              <span className="text-muted-foreground block text-xs">
                Nonaktifkan jika data keluarga tidak lagi digunakan secara
                operasional.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {isSubmitting
            ? "Menyimpan..."
            : mode === "create"
              ? "Simpan & lanjut tambah anggota"
              : "Perbarui KK"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="lg"
          disabled={isSubmitting}
          onClick={() => router.back()}
        >
          Kembali
        </Button>
      </div>
    </form>
  );
}
