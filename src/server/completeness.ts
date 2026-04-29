import {
  getHouseholdCompleteness,
  getResidentCompleteness,
} from "~/server/households";

type CompletenessResidentInput = {
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
  updatedAt: Date;
};

type CompletenessHouseholdInput = {
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
  statusTempatTinggal: string | null;
  statusAktif: boolean;
  updatedAt: Date;
  residents: CompletenessResidentInput[];
};

type QueueStatus = "critical" | "warning";

export type HouseholdQueueItem = {
  kind: "household";
  id: string;
  noKk: string;
  label: string;
  href: string;
  status: QueueStatus;
  score: number;
  missing: string[];
  isActive: boolean;
  updatedAt: Date;
};

export type ResidentQueueItem = {
  kind: "resident";
  id: string;
  householdId: string;
  householdNoKk: string;
  label: string;
  href: string;
  status: QueueStatus;
  score: number;
  missing: string[];
  isActive: boolean;
  updatedAt: Date;
};

function getStatusRank(status: QueueStatus) {
  return status === "critical" ? 0 : 1;
}

function sortQueue<
  T extends { status: QueueStatus; score: number; updatedAt: Date },
>(items: T[]) {
  return [...items].sort((left: T, right: T) => {
    const statusDiff = getStatusRank(left.status) - getStatusRank(right.status);

    if (statusDiff !== 0) {
      return statusDiff;
    }

    if (left.score !== right.score) {
      return left.score - right.score;
    }

    return right.updatedAt.getTime() - left.updatedAt.getTime();
  });
}

export function buildCompletenessQueue(
  households: CompletenessHouseholdInput[],
) {
  const householdItems: HouseholdQueueItem[] = households
    .map((household) => {
      const completeness = getHouseholdCompleteness(household);

      if (completeness.status === "complete") {
        return null;
      }

      return {
        kind: "household" as const,
        id: household.id,
        noKk: household.noKk,
        label: household.kepalaKeluarga,
        href: `/dashboard/kk/${household.id}`,
        status: completeness.status,
        score: completeness.score,
        missing: completeness.missing,
        isActive: household.statusAktif,
        updatedAt: household.updatedAt,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const residentItems: ResidentQueueItem[] = households
    .flatMap((household) =>
      household.residents.map((resident) => {
        const completeness = getResidentCompleteness(resident);

        if (completeness.status === "complete") {
          return null;
        }

        return {
          kind: "resident" as const,
          id: resident.id,
          householdId: household.id,
          householdNoKk: household.noKk,
          label: resident.namaLengkap,
          href: `/dashboard/warga/${resident.id}`,
          status: completeness.status,
          score: completeness.score,
          missing: completeness.missing,
          isActive: resident.isActive,
          updatedAt: resident.updatedAt,
        };
      }),
    )
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    households: sortQueue(householdItems),
    residents: sortQueue(residentItems),
  };
}
