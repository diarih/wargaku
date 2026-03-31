"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, LoaderCircle, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { FormFieldError } from "~/app/dashboard/_components/form-field-error";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  residentEducationOptions,
  residentPayloadSchema,
  residentMaritalStatusOptions,
  residentOccupationOptions,
  residentReligionOptions,
  type ResidentFormValues,
} from "~/server/households";

type ResidentFormProps = {
  mode: "create" | "edit";
  residentId?: string;
  householdId: string;
  householdLabel: string;
  initialValues?: Partial<ResidentFormValues>;
  currentHead?: {
    id: string;
    namaLengkap: string;
  } | null;
};

const defaultValues: ResidentFormValues = {
  householdId: "",
  nik: "",
  namaLengkap: "",
  jenisKelamin: "",
  tempatLahir: "",
  tanggalLahir: "",
  hubunganDalamKk: "",
  isKepalaKeluarga: false,
  agama: "",
  pendidikan: "",
  pekerjaan: "",
  statusPerkawinan: "",
  phone: "",
  email: "",
  isActive: true,
};

const hubunganOptions = [
  "Kepala Keluarga",
  "Istri",
  "Anak",
  "Orang Tua",
  "Menantu",
  "Cucu",
  "Famili Lain",
  "Lainnya",
] as const;

const genderOptions = ["Laki-laki", "Perempuan"] as const;

type SubmitAction = "finish" | "addAnother";

export function ResidentForm({
  mode,
  residentId,
  householdId,
  householdLabel,
  initialValues,
  currentHead,
}: ResidentFormProps) {
  const router = useRouter();
  const [submitAction, setSubmitAction] = useState<SubmitAction>("finish");
  const [pendingValues, setPendingValues] = useState<ResidentFormValues | null>(
    null,
  );
  const [showHeadChangeModal, setShowHeadChangeModal] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ResidentFormValues>({
    resolver: zodResolver(residentPayloadSchema),
    defaultValues: {
      ...defaultValues,
      householdId,
      ...initialValues,
    },
  });

  const isHeadOfFamily = watch("isKepalaKeluarga");
  const hubunganDalamKk = watch("hubunganDalamKk");

  useEffect(() => {
    reset({
      ...defaultValues,
      householdId,
      ...initialValues,
    });
  }, [householdId, initialValues, reset]);

  useEffect(() => {
    if (isHeadOfFamily) {
      setValue("hubunganDalamKk", "Kepala Keluarga", { shouldValidate: true });
    } else if (hubunganDalamKk === "Kepala Keluarga") {
      setValue("hubunganDalamKk", "", { shouldValidate: true });
    }
  }, [hubunganDalamKk, isHeadOfFamily, setValue]);

  const saveResident = async (values: ResidentFormValues) => {
    const normalizedValues = {
      ...values,
      hubunganDalamKk: values.isKepalaKeluarga
        ? "Kepala Keluarga"
        : values.hubunganDalamKk,
    };

    const endpoint =
      mode === "create" ? "/api/residents" : `/api/residents/${residentId}`;
    const method = mode === "create" ? "POST" : "PATCH";

    const response = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizedValues),
    });

    const payload = (await response.json().catch(() => null)) as {
      message?: string;
      redirectTo?: string;
    } | null;

    if (!response.ok) {
      toast.error(payload?.message ?? "Tidak dapat menyimpan data anggota.");
      return;
    }

    if (mode === "create" && submitAction === "addAnother") {
      toast.success(
        "Anggota keluarga berhasil ditambahkan. Lanjutkan tambah data berikutnya.",
      );
      reset({
        ...defaultValues,
        householdId,
        isActive: true,
      });
      router.refresh();
      return;
    }

    toast.success(
      mode === "create"
        ? "Anggota keluarga berhasil ditambahkan."
        : "Data anggota berhasil diperbarui.",
    );
    router.push(payload?.redirectTo ?? `/dashboard/kk/${householdId}`);
    router.refresh();
  };

  const onSubmit = handleSubmit(async (values) => {
    const shouldConfirmHeadChange =
      values.isKepalaKeluarga && !!currentHead && currentHead.id !== residentId;

    if (shouldConfirmHeadChange) {
      setPendingValues(values);
      setShowHeadChangeModal(true);
      return;
    }

    await saveResident(values);
  });

  return (
    <form className="space-y-6" onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Identitas Pribadi</CardTitle>
          <p className="text-muted-foreground text-sm">
            Terhubung ke KK {householdLabel}
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="namaLengkap">Nama Lengkap</Label>
            <Input
              id="namaLengkap"
              className="h-10"
              aria-invalid={!!errors.namaLengkap}
              {...register("namaLengkap")}
            />
            <FormFieldError message={errors.namaLengkap?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nik">NIK</Label>
            <Input
              id="nik"
              className="h-10"
              maxLength={16}
              aria-invalid={!!errors.nik}
              {...register("nik")}
            />
            <FormFieldError message={errors.nik?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
            <select
              id="jenisKelamin"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
              aria-invalid={!!errors.jenisKelamin}
              {...register("jenisKelamin")}
            >
              <option value="">Pilih jenis kelamin</option>
              {genderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FormFieldError message={errors.jenisKelamin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tempatLahir">Tempat Lahir</Label>
            <Input
              id="tempatLahir"
              className="h-10"
              aria-invalid={!!errors.tempatLahir}
              required
              {...register("tempatLahir")}
            />
            <FormFieldError message={errors.tempatLahir?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
            <Input
              id="tanggalLahir"
              type="date"
              className="h-10"
              aria-invalid={!!errors.tanggalLahir}
              required
              {...register("tanggalLahir")}
            />
            <FormFieldError message={errors.tanggalLahir?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status Dalam Keluarga</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="hubunganDalamKk">Hubungan Dalam KK</Label>
            <select
              id="hubunganDalamKk"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
              aria-invalid={!!errors.hubunganDalamKk}
              {...register("hubunganDalamKk")}
            >
              <option value="">Pilih hubungan</option>
              {hubunganOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FormFieldError message={errors.hubunganDalamKk?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="statusPerkawinan">Status Perkawinan</Label>
            <select
              id="statusPerkawinan"
              className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
              aria-invalid={!!errors.statusPerkawinan}
              {...register("statusPerkawinan")}
            >
              <option value="">Pilih status perkawinan</option>
              {residentMaritalStatusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <FormFieldError message={errors.statusPerkawinan?.message} />
          </div>
          <label className="bg-secondary/40 flex items-center gap-3 rounded-2xl border p-4">
            <input
              type="checkbox"
              className="border-input text-primary size-4 rounded"
              {...register("isKepalaKeluarga")}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">
                Jadikan kepala keluarga
              </span>
              <span className="text-muted-foreground block text-xs">
                Sistem akan menjadikannya identitas utama untuk kartu keluarga
                ini.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informasi Tambahan</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {[
            {
              id: "agama",
              label: "Agama",
              options: residentReligionOptions,
              placeholder: "Pilih agama",
            },
            {
              id: "pendidikan",
              label: "Pendidikan",
              options: residentEducationOptions,
              placeholder: "Pilih pendidikan",
            },
            {
              id: "pekerjaan",
              label: "Pekerjaan",
              options: residentOccupationOptions,
              placeholder: "Pilih pekerjaan",
            },
          ].map((field) => {
            const name = field.id as keyof ResidentFormValues;

            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <select
                  id={field.id}
                  className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-10 w-full rounded-lg border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
                  aria-invalid={!!errors[name]}
                  {...register(name)}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <FormFieldError message={errors[name]?.message} />
              </div>
            );
          })}

          {[
            { id: "phone", label: "Nomor Telepon" },
            { id: "email", label: "Email", type: "email" },
          ].map((field) => {
            const name = field.id as keyof ResidentFormValues;

            return (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>{field.label}</Label>
                <Input
                  id={field.id}
                  type={field.type ?? "text"}
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
              {...register("isActive")}
            />
            <span className="space-y-1">
              <span className="block text-sm font-medium">
                Status anggota aktif
              </span>
              <span className="text-muted-foreground block text-xs">
                Nonaktifkan jika anggota tidak lagi tercatat aktif di KK ini.
              </span>
            </span>
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="submit"
          size="lg"
          disabled={isSubmitting}
          onClick={() => setSubmitAction("finish")}
        >
          {isSubmitting && submitAction === "finish" ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : null}
          {isSubmitting && submitAction === "finish"
            ? "Menyimpan..."
            : mode === "create"
              ? "Simpan & selesai"
              : "Perbarui anggota"}
        </Button>
        {mode === "create" ? (
          <Button
            type="submit"
            variant="outline"
            size="lg"
            disabled={isSubmitting}
            onClick={() => setSubmitAction("addAnother")}
          >
            {isSubmitting && submitAction === "addAnother" ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            {isSubmitting && submitAction === "addAnother"
              ? "Menyimpan..."
              : "Simpan & tambah lagi"}
          </Button>
        ) : null}
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

      {showHeadChangeModal ? (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-background w-full max-w-lg rounded-3xl border p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-700">
                <AlertTriangle className="size-5" />
              </span>
              <div className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  Kepala keluarga akan diganti
                </h2>
                <p className="text-muted-foreground text-sm">
                  {currentHead?.namaLengkap} saat ini tercatat sebagai kepala
                  keluarga. Jika dilanjutkan, status kepala keluarga lama akan
                  dihapus dan hubungan dalam KK-nya dikosongkan agar bisa
                  disesuaikan lagi.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowHeadChangeModal(false);
                  setPendingValues(null);
                }}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  if (!pendingValues) return;
                  setShowHeadChangeModal(false);
                  await saveResident(pendingValues);
                  setPendingValues(null);
                }}
              >
                Lanjutkan
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}
