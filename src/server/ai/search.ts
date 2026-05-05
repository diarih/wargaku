import { z } from "zod";

import { chatWithQwen, isQwenConfigured } from "~/server/ai/qwen";
import {
  getHouseholdCompleteness,
  getResidentCompleteness,
  householdHousingStatusOptions,
} from "~/server/households";

const residentMissingFieldOptions = [
  "nik",
  "namaLengkap",
  "jenisKelamin",
  "hubunganDalamKk",
  "tempatLahir",
  "tanggalLahir",
  "agama",
  "pendidikan",
  "pekerjaan",
  "statusPerkawinan",
] as const;

const householdMissingFieldOptions = [
  "statusTempatTinggal",
  "kepalaKeluarga",
  "anggotaKeluarga",
  "dokumen",
] as const;

const householdCompletenessStatusOptions = [
  "complete",
  "warning",
  "critical",
] as const;

const residentMissingFieldAliasMap: Record<string, (typeof residentMissingFieldOptions)[number]> = {
  nik: "nik",
  nama_lengkap: "namaLengkap",
  namalengkap: "namaLengkap",
  nama: "namaLengkap",
  namaLengkap: "namaLengkap",
  jenis_kelamin: "jenisKelamin",
  jeniskelamin: "jenisKelamin",
  jenisKelamin: "jenisKelamin",
  hubungan_dalam_kk: "hubunganDalamKk",
  hubungandalamkk: "hubunganDalamKk",
  hubunganDalamKk: "hubunganDalamKk",
  tempat_lahir: "tempatLahir",
  tempatlahir: "tempatLahir",
  tempatLahir: "tempatLahir",
  tanggal_lahir: "tanggalLahir",
  tanggallahir: "tanggalLahir",
  tanggalLahir: "tanggalLahir",
  agama: "agama",
  pendidikan: "pendidikan",
  pekerjaan: "pekerjaan",
  status_perkawinan: "statusPerkawinan",
  statusperkawinan: "statusPerkawinan",
  status_pernikahan: "statusPerkawinan",
  statusPerkawinan: "statusPerkawinan",
};

const householdMissingFieldAliasMap: Record<string, (typeof householdMissingFieldOptions)[number]> = {
  status_tempat_tinggal: "statusTempatTinggal",
  statustempattinggal: "statusTempatTinggal",
  statusTempatTinggal: "statusTempatTinggal",
  kepala_keluarga: "kepalaKeluarga",
  kepalakeluarga: "kepalaKeluarga",
  kepalaKeluarga: "kepalaKeluarga",
  anggota_keluarga: "anggotaKeluarga",
  anggotakeluarga: "anggotaKeluarga",
  anggotaKeluarga: "anggotaKeluarga",
  dokumen: "dokumen",
};

const householdCompletenessStatusAliasMap: Record<
  string,
  (typeof householdCompletenessStatusOptions)[number] | null
> = {
  lengkap: "complete",
  complete: "complete",
  warning: "warning",
  perlu_dilengkapi: "warning",
  perludilengkapi: "warning",
  belum_lengkap: "warning",
  belumlengkap: "warning",
  incomplete: "warning",
  kritis: "critical",
  critical: "critical",
  perlu_dirapikan: "critical",
  perludirapikan: "critical",
  paling_perlu_dirapikan: "critical",
  palingperludirapikan: "critical",
};

export const adminAiSearchIntentSchema = z.object({
  answer: z.string().min(1),
  entityScope: z.enum(["all", "household", "resident", "document"]),
  keywords: z.array(z.string().trim().min(1)).max(8).default([]),
  activeOnly: z.boolean().optional(),
  needsDocuments: z.boolean().optional(),
  residentMissingFields: z
    .array(z.enum(residentMissingFieldOptions))
    .max(5)
    .optional(),
  householdMissingFields: z
    .array(z.enum(householdMissingFieldOptions))
    .max(4)
    .optional(),
  householdCompletenessStatuses: z
    .array(z.enum(householdCompletenessStatusOptions))
    .max(3)
    .optional(),
  housingStatuses: z.array(z.enum(householdHousingStatusOptions)).optional(),
});

export type AdminAiSearchIntent = z.infer<typeof adminAiSearchIntentSchema>;

type SearchHousehold = {
  id: string;
  noKk: string;
  kepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  kelurahan: string;
  kecamatan: string;
  kota: string;
  provinsi: string;
  phone: string | null;
  statusAktif: boolean;
  statusTempatTinggal: string | null;
  files: Array<{ id: string }>;
  residents: Array<{
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
    isKepalaKeluarga: boolean;
    isActive: boolean;
  }>;
};

type SearchResident = {
  id: string;
  namaLengkap: string;
  nik: string;
  hubunganDalamKk: string;
  isActive: boolean;
  householdId: string;
  householdNoKk: string;
  jenisKelamin: string;
  tempatLahir: string | null;
  tanggalLahir: Date | null;
  agama: string | null;
  pendidikan: string | null;
  pekerjaan: string | null;
  statusPerkawinan: string | null;
  files: Array<{ id: string }>;
};

type SearchDocument = {
  id: string;
  fileName: string;
  mimeType: string;
  householdId: string | null;
  residentId: string | null;
  householdNoKk: string | null;
  residentName: string | null;
};

function parseJsonObject<T>(content: string, schema: z.ZodSchema<T>) {
  const fenced = /```json\s*([\s\S]*?)```/i.exec(content);
  const raw = fenced?.[1] ?? content;
  return schema.parse(JSON.parse(raw));
}

function normalizeModelFieldName(value: string) {
  return value.trim().replace(/[\s-]+/g, "_").toLocaleLowerCase("id-ID");
}

function normalizeAdminAiIntent(input: unknown) {
  if (!input || typeof input !== "object") {
    return input;
  }

  const value = input as {
    answer?: unknown;
    entityScope?: unknown;
    residentMissingFields?: unknown;
    householdMissingFields?: unknown;
    householdCompletenessStatuses?: unknown;
  };

  const normalizedResidentMissingFields = Array.isArray(value.residentMissingFields)
    ? value.residentMissingFields
        .map((field) => {
          if (typeof field !== "string") return null;
          return residentMissingFieldAliasMap[normalizeModelFieldName(field)] ?? null;
        })
        .filter((field): field is (typeof residentMissingFieldOptions)[number] => field !== null)
    : value.residentMissingFields;

  const normalizedHouseholdMissingFields = Array.isArray(value.householdMissingFields)
    ? value.householdMissingFields
        .map((field) => {
          if (typeof field !== "string") return null;
          return householdMissingFieldAliasMap[normalizeModelFieldName(field)] ?? null;
        })
        .filter((field): field is (typeof householdMissingFieldOptions)[number] => field !== null)
    : value.householdMissingFields;

  const normalizedHouseholdCompletenessStatuses = Array.isArray(
    value.householdCompletenessStatuses,
  )
    ? value.householdCompletenessStatuses
        .map((status) => {
          if (typeof status !== "string") return null;
          return (
            householdCompletenessStatusAliasMap[normalizeModelFieldName(status)] ??
            null
          );
        })
        .filter(
          (
            status,
          ): status is (typeof householdCompletenessStatusOptions)[number] =>
            status !== null,
        )
    : value.householdCompletenessStatuses;

  const answerText = typeof value.answer === "string" ? value.answer : "";
  const normalizedAnswer = normalizeModelFieldName(answerText);
  const shouldDefaultToIncompleteHouseholds =
    normalizedHouseholdCompletenessStatuses === undefined &&
    (normalizedAnswer.includes("dirapikan") ||
      normalizedAnswer.includes("belum_lengkap") ||
      normalizedAnswer.includes("perlu_dilengkapi"));
  const shouldForceHouseholdScope =
    (Array.isArray(normalizedHouseholdCompletenessStatuses) &&
      normalizedHouseholdCompletenessStatuses.length > 0) ||
    shouldDefaultToIncompleteHouseholds;

  return {
    ...input,
    entityScope:
      shouldForceHouseholdScope &&
      (value.entityScope === "all" || value.entityScope === undefined)
        ? "household"
        : value.entityScope,
    residentMissingFields: normalizedResidentMissingFields,
    householdMissingFields: normalizedHouseholdMissingFields,
    householdCompletenessStatuses:
      normalizedHouseholdCompletenessStatuses ??
      (shouldDefaultToIncompleteHouseholds ? ["critical", "warning"] : undefined),
  };
}

function normalize(value: string | null | undefined) {
  return value?.toLocaleLowerCase("id-ID") ?? "";
}

function includesAllKeywords(values: Array<string | null | undefined>, keywords: string[]) {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = values.map(normalize).join(" ");
  return keywords.every((keyword) => haystack.includes(normalize(keyword)));
}

export async function interpretAdminAiSearchQuery(query: string) {
  if (!isQwenConfigured()) {
    return adminAiSearchIntentSchema.parse({
      answer:
        "AI search belum dikonfigurasi. Gunakan kata kunci biasa atau tambahkan Qwen API key.",
      entityScope: "all",
      keywords: query.trim() ? [query.trim()] : [],
    });
  }

  const content = await chatWithQwen({
    system:
      "Kamu adalah asisten pencarian admin untuk aplikasi pendataan warga. Ubah permintaan admin menjadi JSON terstruktur saja. Jangan tambahkan penjelasan di luar JSON. Gunakan field yang tersedia: answer, entityScope, keywords, activeOnly, needsDocuments, residentMissingFields, householdMissingFields, householdCompletenessStatuses, housingStatuses. Untuk residentMissingFields, gunakan hanya nilai enum ini persis: nik, namaLengkap, jenisKelamin, hubunganDalamKk, tempatLahir, tanggalLahir, agama, pendidikan, pekerjaan, statusPerkawinan. Untuk householdMissingFields, gunakan hanya: statusTempatTinggal, kepalaKeluarga, anggotaKeluarga, dokumen. Untuk householdCompletenessStatuses, gunakan hanya: complete, warning, critical. Status kelengkapan hanya berlaku untuk KK. Jika admin bertanya data KK yang paling perlu dirapikan, prioritaskan entityScope household dan householdCompletenessStatuses [critical, warning].",
    user: `Permintaan admin: ${query}`,
  });

  const raw = parseJsonObject(content, z.unknown());
  const parsed = adminAiSearchIntentSchema.parse(normalizeAdminAiIntent(raw));
  return {
    ...parsed,
    keywords: parsed.keywords ?? [],
  };
}

export function filterAdminAiSearchResults({
  intent,
  households,
  residents,
  documents,
}: {
  intent: AdminAiSearchIntent;
  households: SearchHousehold[];
  residents: SearchResident[];
  documents: SearchDocument[];
}) {
  const keywords = intent.keywords.map((keyword) => keyword.trim()).filter(Boolean);

  const householdResults =
    intent.entityScope === "resident" || intent.entityScope === "document"
      ? []
      : households
          .map((household) => ({
            household,
            completeness: getHouseholdCompleteness(household),
          }))
          .filter(({ household, completeness }) => {
            if (intent.activeOnly && !household.statusAktif) return false;
            if (
              intent.housingStatuses?.length &&
              !intent.housingStatuses.includes(
                household.statusTempatTinggal as (typeof householdHousingStatusOptions)[number],
              )
            ) {
              return false;
            }
            if (intent.needsDocuments && household.files.length > 0) return false;
            if (
              intent.householdCompletenessStatuses?.length &&
              !intent.householdCompletenessStatuses.includes(completeness.status)
            ) {
              return false;
            }

            if (intent.householdMissingFields?.length) {
              const missingText = completeness.missing.join(" ").toLocaleLowerCase("id-ID");
              const hasAll = intent.householdMissingFields.every((field) => {
                if (field === "statusTempatTinggal") {
                  return missingText.includes("status tempat tinggal");
                }
                if (field === "kepalaKeluarga") {
                  return missingText.includes("kepala keluarga");
                }
                if (field === "anggotaKeluarga") {
                  return missingText.includes("anggota keluarga");
                }
                return household.files.length === 0;
              });

              if (!hasAll) return false;
            }

            return includesAllKeywords(
              [
                household.noKk,
                household.kepalaKeluarga,
                household.alamat,
                household.phone,
                household.statusTempatTinggal,
              ],
              keywords,
            );
          })
          .sort((left, right) => {
            const leftRank =
              left.completeness.status === "critical"
                ? 0
                : left.completeness.status === "warning"
                  ? 1
                  : 2;
            const rightRank =
              right.completeness.status === "critical"
                ? 0
                : right.completeness.status === "warning"
                  ? 1
                  : 2;

            if (leftRank !== rightRank) {
              return leftRank - rightRank;
            }

            return left.completeness.score - right.completeness.score;
          })
          .map(({ household }) => household);

  const residentResults =
    intent.entityScope === "household" || intent.entityScope === "document"
      ? []
      : residents.filter((resident) => {
          if (intent.activeOnly && !resident.isActive) return false;
          if (intent.needsDocuments && resident.files.length > 0) return false;

          const completeness = getResidentCompleteness({
            id: resident.id,
            namaLengkap: resident.namaLengkap,
            nik: resident.nik,
            jenisKelamin: resident.jenisKelamin,
            tempatLahir: resident.tempatLahir,
            tanggalLahir: resident.tanggalLahir,
            hubunganDalamKk: resident.hubunganDalamKk,
            agama: resident.agama,
            pendidikan: resident.pendidikan,
            pekerjaan: resident.pekerjaan,
            statusPerkawinan: resident.statusPerkawinan,
            isKepalaKeluarga: false,
          });

          if (intent.residentMissingFields?.length) {
            const missingText = completeness.missing.join(" ").toLocaleLowerCase("id-ID");
            const hasAll = intent.residentMissingFields.every((field) =>
              missingText.includes(field.toLocaleLowerCase("id-ID")),
            );

            if (!hasAll) return false;
          }

          return includesAllKeywords(
            [resident.namaLengkap, resident.nik, resident.hubunganDalamKk, resident.householdNoKk],
            keywords,
          );
        });

  const documentResults =
    intent.entityScope === "household" || intent.entityScope === "resident"
      ? []
      : documents.filter((document) =>
          includesAllKeywords(
            [document.fileName, document.householdNoKk, document.residentName, document.mimeType],
            keywords,
          ),
        );

  return {
    households: householdResults.slice(0, 8).map((household) => ({
      id: household.id,
      noKk: household.noKk,
      kepalaKeluarga: household.kepalaKeluarga,
      href: `/dashboard/kk/${household.id}`,
    })),
    residents: residentResults.slice(0, 10).map((resident) => ({
      id: resident.id,
      namaLengkap: resident.namaLengkap,
      nik: resident.nik,
      householdNoKk: resident.householdNoKk,
      href: `/dashboard/warga/${resident.id}`,
    })),
    documents: documentResults.slice(0, 10).map((document) => ({
      id: document.id,
      fileName: document.fileName,
      label:
        document.residentName ??
        (document.householdNoKk ? `KK ${document.householdNoKk}` : document.mimeType),
      href: document.residentId
        ? `/dashboard/warga/${document.residentId}`
        : document.householdId
          ? `/dashboard/kk/${document.householdId}`
          : "/dashboard/dokumen",
    })),
  };
}

export async function getCompletenessAssistantCopy({
  entityLabel,
  score,
  missing,
}: {
  entityLabel: string;
  score: number;
  missing: string[];
}) {
  if (missing.length === 0) {
    return `${entityLabel} sudah lengkap dan siap dipakai operasional.`;
  }

  if (!isQwenConfigured()) {
    return `${entityLabel} masih perlu dilengkapi. Prioritas saat ini: ${missing.join(", ")}.`;
  }

  try {
    const content = await chatWithQwen({
      system:
        "Kamu adalah asisten kualitas data admin. Balas satu atau dua kalimat singkat dalam bahasa Indonesia yang menjelaskan kelengkapan data secara praktis untuk operator.",
      user: `${entityLabel} memiliki skor kelengkapan ${score}%. Field yang masih kosong: ${missing.join(", ")}.`,
      temperature: 0.2,
    });

    return content;
  } catch {
    return `${entityLabel} masih perlu dilengkapi. Prioritas saat ini: ${missing.join(", ")}.`;
  }
}
