import {
  getHouseholdCompleteness,
  getResidentCompleteness,
  normalizeOptional,
  parseHouseholdPayload,
  parseResidentPayload,
  toDateValue,
} from "~/server/households";

describe("household helpers", () => {
  it("normalizes optional strings into trimmed values or null", () => {
    expect(normalizeOptional("  Bandung ")).toBe("Bandung");
    expect(normalizeOptional("   ")).toBe("");
    expect(normalizeOptional(undefined)).toBeNull();
  });

  it("parses valid household payloads and trims values", () => {
    expect(
      parseHouseholdPayload({
        noKk: " 3201010101010101 ",
        alamat: "  Jalan Melati No. 17 ",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        kodePos: "40615",
        statusAktif: true,
      }),
    ).toMatchObject({
      noKk: "3201010101010101",
      alamat: "Jalan Melati No. 17",
    });
  });

  it("rejects invalid resident payloads", () => {
    expect(() =>
      parseResidentPayload({
        householdId: "hh-1",
        nik: "123",
        namaLengkap: "A",
        jenisKelamin: "",
        hubunganDalamKk: "",
      }),
    ).toThrow("NIK harus terdiri dari 16 digit.");
  });

  it("converts valid date strings and ignores invalid values", () => {
    expect(toDateValue("2024-02-10")?.toISOString()).toContain("2024-02-10");
    expect(toDateValue("tanggal-salah")).toBeNull();
    expect(toDateValue("   ")).toBeNull();
  });

  it("marks residents with missing critical fields as incomplete", () => {
    expect(
      getResidentCompleteness({
        id: "resident-1",
        namaLengkap: "Budi",
        nik: "3201010101010101",
        jenisKelamin: "Laki-laki",
        tempatLahir: null,
        tanggalLahir: null,
        hubunganDalamKk: "Anak",
        agama: null,
        pendidikan: null,
        pekerjaan: null,
        statusPerkawinan: null,
        statusTinggal: "Tetap",
        isKepalaKeluarga: false,
      }),
    ).toMatchObject({
      status: "critical",
      missing: expect.arrayContaining(["Tempat lahir", "Tanggal lahir"]),
    });
  });

  it("marks households without a single head of family as critical", () => {
    expect(
      getHouseholdCompleteness({
        noKk: "3201010101010101",
        alamat: "Jalan Melati No. 17",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        residents: [
          {
            id: "resident-1",
            namaLengkap: "Budi",
            nik: "3201010101010101",
            jenisKelamin: "Laki-laki",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1990-01-01"),
            hubunganDalamKk: "Suami",
            agama: "Islam",
            pendidikan: "SMA",
            pekerjaan: "Karyawan",
            statusPerkawinan: "Kawin",
            statusTinggal: "Tetap",
            isKepalaKeluarga: false,
          },
        ],
      }),
    ).toMatchObject({
      status: "warning",
      missing: expect.arrayContaining(["Kepala keluarga belum dipilih"]),
    });
  });
});
