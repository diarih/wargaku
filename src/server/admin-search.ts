export type AdminSearchHousehold = {
  id: string;
  noKk: string;
  kepalaKeluarga: string;
  alamat: string;
  phone: string | null;
  statusAktif: boolean;
};

export type AdminSearchResident = {
  id: string;
  householdId: string;
  householdNoKk: string;
  namaLengkap: string;
  nik: string;
  hubunganDalamKk: string;
  isActive: boolean;
};

export type AdminSearchDocument = {
  id: string;
  fileName: string;
  householdId: string | null;
  householdNoKk: string | null;
  residentId: string | null;
  residentName: string | null;
  createdAt: Date;
};

function includesQuery(value: string | null | undefined, query: string) {
  return value?.toLocaleLowerCase("id-ID").includes(query) ?? false;
}

export function normalizeAdminSearchQuery(query: string | null | undefined) {
  return query?.trim().toLocaleLowerCase("id-ID") ?? "";
}

export function buildAdminSearchResults({
  query,
  households,
  residents,
  documents,
}: {
  query: string;
  households: AdminSearchHousehold[];
  residents: AdminSearchResident[];
  documents: AdminSearchDocument[];
}) {
  const normalizedQuery = normalizeAdminSearchQuery(query);

  if (!normalizedQuery) {
    return {
      households: [],
      residents: [],
      documents: [],
    };
  }

  return {
    households: households
      .filter(
        (household) =>
          includesQuery(household.noKk, normalizedQuery) ||
          includesQuery(household.kepalaKeluarga, normalizedQuery) ||
          includesQuery(household.alamat, normalizedQuery) ||
          includesQuery(household.phone, normalizedQuery),
      )
      .map((household) => ({
        ...household,
        href: `/dashboard/kk/${household.id}`,
      })),
    residents: residents
      .filter(
        (resident) =>
          includesQuery(resident.namaLengkap, normalizedQuery) ||
          includesQuery(resident.nik, normalizedQuery) ||
          includesQuery(resident.hubunganDalamKk, normalizedQuery) ||
          includesQuery(resident.householdNoKk, normalizedQuery),
      )
      .map((resident) => ({
        ...resident,
        href: `/dashboard/warga/${resident.id}`,
      })),
    documents: documents
      .filter(
        (document) =>
          includesQuery(document.fileName, normalizedQuery) ||
          includesQuery(document.householdNoKk, normalizedQuery) ||
          includesQuery(document.residentName, normalizedQuery),
      )
      .map((document) => ({
        ...document,
        href: document.residentId
          ? `/dashboard/warga/${document.residentId}`
          : document.householdId
            ? `/dashboard/kk/${document.householdId}`
            : "/dashboard/dokumen",
      })),
  };
}
