import { z } from "zod";

export const householdPayloadSchema = z.object({
  noKk: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "Nomor KK harus terdiri dari 16 digit."),
  alamat: z.string().trim().min(5, "Alamat minimal 5 karakter."),
  rt: z.string().trim().min(1, "RT wajib diisi."),
  rw: z.string().trim().min(1, "RW wajib diisi."),
  kelurahan: z.string().trim().min(2, "Kelurahan wajib diisi."),
  kecamatan: z.string().trim().min(2, "Kecamatan wajib diisi."),
  kota: z.string().trim().min(2, "Kota/Kabupaten wajib diisi."),
  provinsi: z.string().trim().min(2, "Provinsi wajib diisi."),
  kodePos: z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .regex(/^\d{5}$/, "Kode pos harus 5 digit."),
    ])
    .optional(),
  statusAktif: z.boolean().default(true),
});

export const residentPayloadSchema = z.object({
  householdId: z.string().trim().min(1),
  nik: z
    .string()
    .trim()
    .regex(/^\d{16}$/, "NIK harus terdiri dari 16 digit."),
  namaLengkap: z.string().trim().min(2, "Nama lengkap minimal 2 karakter."),
  jenisKelamin: z.string().trim().min(1, "Jenis kelamin wajib dipilih."),
  tempatLahir: z.string().trim().optional().or(z.literal("")),
  tanggalLahir: z.string().trim().optional().or(z.literal("")),
  hubunganDalamKk: z.string().trim().min(2, "Hubungan dalam KK wajib dipilih."),
  isKepalaKeluarga: z.boolean().default(false),
  agama: z.string().trim().optional().or(z.literal("")),
  pendidikan: z.string().trim().optional().or(z.literal("")),
  pekerjaan: z.string().trim().optional().or(z.literal("")),
  statusPerkawinan: z.string().trim().optional().or(z.literal("")),
  statusTinggal: z.string().trim().optional().or(z.literal("")),
  phone: z.string().trim().optional().or(z.literal("")),
  email: z
    .union([
      z.literal(""),
      z.string().trim().email("Format email tidak valid."),
    ])
    .optional(),
  isActive: z.boolean().default(true),
});

export type HouseholdPayload = z.output<typeof householdPayloadSchema>;
export type HouseholdFormValues = z.input<typeof householdPayloadSchema>;
export type ResidentPayload = z.output<typeof residentPayloadSchema>;
export type ResidentFormValues = z.input<typeof residentPayloadSchema>;

export function normalizeOptional(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ?? null;
}

export function parseHouseholdPayload(input: unknown) {
  return householdPayloadSchema.parse(input);
}

export function parseResidentPayload(input: unknown) {
  return residentPayloadSchema.parse(input);
}

export function toDateValue(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

type ResidentCompletenessInput = {
  id: string;
  namaLengkap: string;
  nik: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  hubunganDalamKk: string;
  agama: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  statusPerkawinan: string | null;
  statusTinggal: string | null;
  isKepalaKeluarga: boolean;
};

type HouseholdCompletenessInput = {
  noKk: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  residents: ResidentCompletenessInput[];
};

export function getResidentCompleteness(resident: ResidentCompletenessInput) {
  const missing: string[] = [];

  if (!resident.nik?.trim()) missing.push("NIK");
  if (!resident.namaLengkap?.trim()) missing.push("Nama lengkap");
  if (!resident.jenisKelamin?.trim()) missing.push("Jenis kelamin");
  if (!resident.hubunganDalamKk?.trim()) missing.push("Hubungan dalam KK");
  if (!resident.tempatLahir?.trim()) missing.push("Tempat lahir");
  if (!resident.tanggalLahir) missing.push("Tanggal lahir");
  if (!resident.agama?.trim()) missing.push("Agama");
  if (!resident.pendidikan?.trim()) missing.push("Pendidikan");
  if (!resident.pekerjaan?.trim()) missing.push("Pekerjaan");
  if (!resident.statusPerkawinan?.trim()) missing.push("Status perkawinan");

  const totalChecks = 10;
  const score = Math.round(
    ((totalChecks - missing.length) / totalChecks) * 100,
  );

  return {
    score,
    missing,
    status:
      missing.length === 0
        ? "complete"
        : missing.length <= 3
          ? "warning"
          : "critical",
  } as const;
}

export function getHouseholdCompleteness(
  household: HouseholdCompletenessInput,
) {
  const missing: string[] = [];

  if (!household.noKk?.trim()) missing.push("Nomor KK");
  if (!household.alamat?.trim()) missing.push("Alamat");
  if (!household.rt?.trim()) missing.push("RT");
  if (!household.rw?.trim()) missing.push("RW");
  if (!household.kelurahan?.trim()) missing.push("Kelurahan");
  if (!household.kecamatan?.trim()) missing.push("Kecamatan");
  if (!household.kota?.trim()) missing.push("Kota/Kabupaten");
  if (!household.provinsi?.trim()) missing.push("Provinsi");

  const heads = household.residents.filter(
    (resident) => resident.isKepalaKeluarga,
  );

  if (heads.length === 0) {
    missing.push("Kepala keluarga belum dipilih");
  }

  if (heads.length > 1) {
    missing.push("Kepala keluarga harus tepat satu orang");
  }

  if (household.residents.length === 0) {
    missing.push("Belum ada anggota keluarga");
  }

  const residentStatuses = household.residents.map(getResidentCompleteness);
  const residentPenalty = residentStatuses.filter(
    (item) => item.missing.length > 0,
  ).length;
  const totalChecks = 10 + Math.max(household.residents.length, 1);
  const score = Math.max(
    0,
    Math.round(
      ((totalChecks - missing.length - residentPenalty) / totalChecks) * 100,
    ),
  );

  let status: "complete" | "warning" | "critical" = "complete";

  if (missing.length > 0 || residentPenalty > 0) {
    status = missing.some(
      (item) =>
        item.includes("tepat satu") || item.includes("Belum ada anggota"),
    )
      ? "critical"
      : "warning";
  }

  return {
    score,
    missing,
    residentStatuses,
    headOfFamily: heads[0] ?? null,
    status,
  };
}
