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
        statusTempatTinggal: "Milik Sendiri",
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
        isKepalaKeluarga: false,
      }),
    ).toMatchObject({
      status: "critical",
      missing: expect.arrayContaining(["Tempat lahir", "Tanggal lahir"]),
    });
  });

  it("marks residents with 1-3 missing fields as warning", () => {
    expect(
      getResidentCompleteness({
        id: "resident-2",
        namaLengkap: "Siti",
        nik: "3201010101010102",
        jenisKelamin: "Perempuan",
        tempatLahir: "Bandung",
        tanggalLahir: new Date("1994-02-03"),
        hubunganDalamKk: "Istri",
        agama: null,
        pendidikan: "SMA/SMK/Sederajat",
        pekerjaan: null,
        statusPerkawinan: "Kawin",
        isKepalaKeluarga: false,
      }),
    ).toMatchObject({
      status: "warning",
      score: 80,
      missing: ["Agama", "Pekerjaan"],
    });
  });

  it("marks residents with complete data as complete", () => {
    expect(
      getResidentCompleteness({
        id: "resident-3",
        namaLengkap: "Siti",
        nik: "3201010101010103",
        jenisKelamin: "Perempuan",
        tempatLahir: "Bandung",
        tanggalLahir: new Date("1994-02-03"),
        hubunganDalamKk: "Istri",
        agama: "Islam",
        pendidikan: "SMA/SMK/Sederajat",
        pekerjaan: "Wiraswasta",
        statusPerkawinan: "Kawin",
        isKepalaKeluarga: false,
      }),
    ).toMatchObject({
      status: "complete",
      score: 100,
      missing: [],
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
        statusTempatTinggal: null,
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
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Karyawan Swasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: false,
          },
        ],
      }),
    ).toMatchObject({
      status: "warning",
      missing: expect.arrayContaining([
        "Kepala keluarga belum dipilih",
        "Status tempat tinggal belum diisi",
      ]),
    });
  });

  it("marks households with duplicate heads as critical", () => {
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
        phone: "08123456789",
        statusTempatTinggal: "Kontrak",
        residents: [
          {
            id: "resident-1",
            namaLengkap: "Budi",
            nik: "3201010101010101",
            jenisKelamin: "Laki-laki",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1990-01-01"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Karyawan Swasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
          },
          {
            id: "resident-2",
            namaLengkap: "Siti",
            nik: "3201010101010102",
            jenisKelamin: "Perempuan",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1992-01-01"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Wiraswasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
          },
        ],
      }),
    ).toMatchObject({
      status: "critical",
      missing: expect.arrayContaining([
        "Kepala keluarga harus tepat satu orang",
      ]),
    });
  });

  it("marks households with no residents as critical", () => {
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
        phone: "08123456789",
        statusTempatTinggal: "Kontrak",
        residents: [],
      }),
    ).toMatchObject({
      status: "critical",
      missing: expect.arrayContaining(["Belum ada anggota keluarga"]),
    });
  });

  it("returns a complete household score for complete data", () => {
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
        phone: "08123456789",
        statusTempatTinggal: "Kontrak",
        residents: [
          {
            id: "resident-1",
            namaLengkap: "Budi",
            nik: "3201010101010101",
            jenisKelamin: "Laki-laki",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1990-01-01"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Karyawan Swasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
          },
        ],
      }),
    ).toMatchObject({
      status: "complete",
      score: 100,
      missing: [],
      headOfFamily: expect.objectContaining({ namaLengkap: "Budi" }),
    });
  });
});
