import {
  buildAdminSearchResults,
  normalizeAdminSearchQuery,
} from "~/server/admin-search";

describe("admin search helpers", () => {
  it("normalizes and trims the search query", () => {
    expect(normalizeAdminSearchQuery("  Siti  ")).toBe("siti");
    expect(normalizeAdminSearchQuery("   ")).toBe("");
  });

  it("groups matching households, residents, and documents", () => {
    const results = buildAdminSearchResults({
      query: "siti",
      households: [
        {
          id: "household-1",
          noKk: "3201010101010101",
          kepalaKeluarga: "Budi Santoso",
          alamat: "Jalan Melati 1",
          phone: "08123",
          statusAktif: true,
        },
      ],
      residents: [
        {
          id: "resident-1",
          householdId: "household-1",
          householdNoKk: "3201010101010101",
          namaLengkap: "Siti Aminah",
          nik: "3201010101010102",
          hubunganDalamKk: "Istri",
          isActive: true,
        },
      ],
      documents: [
        {
          id: "file-1",
          fileName: "ktp-siti.pdf",
          householdId: null,
          householdNoKk: null,
          residentId: "resident-1",
          residentName: "Siti Aminah",
          createdAt: new Date("2026-04-01T00:00:00.000Z"),
        },
      ],
    });

    expect(results.households).toHaveLength(0);
    expect(results.residents).toMatchObject([
      {
        id: "resident-1",
        href: "/dashboard/warga/resident-1",
      },
    ]);
    expect(results.documents).toMatchObject([
      {
        id: "file-1",
        href: "/dashboard/warga/resident-1",
      },
    ]);
  });

  it("matches household records by kk number and address fields", () => {
    const results = buildAdminSearchResults({
      query: "melati",
      households: [
        {
          id: "household-1",
          noKk: "3201010101010101",
          kepalaKeluarga: "Budi Santoso",
          alamat: "Jalan Melati 1",
          phone: null,
          statusAktif: true,
        },
      ],
      residents: [],
      documents: [],
    });

    expect(results.households).toMatchObject([
      {
        id: "household-1",
        href: "/dashboard/kk/household-1",
      },
    ]);
  });
});
