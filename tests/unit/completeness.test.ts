import { buildCompletenessQueue } from "~/server/completeness";

describe("completeness queue helpers", () => {
  it("returns only incomplete households and residents", () => {
    const queue = buildCompletenessQueue([
      {
        id: "household-1",
        noKk: "3201010101010101",
        kepalaKeluarga: "Budi",
        alamat: "Jalan Melati 1",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        phone: null,
        statusTempatTinggal: null,
        statusAktif: true,
        updatedAt: new Date("2026-04-05T00:00:00.000Z"),
        residents: [
          {
            id: "resident-1",
            namaLengkap: "Budi",
            nik: "3201010101010101",
            jenisKelamin: "Laki-laki",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1990-01-01T00:00:00.000Z"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Karyawan Swasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
            isActive: true,
            updatedAt: new Date("2026-04-05T00:00:00.000Z"),
          },
          {
            id: "resident-2",
            namaLengkap: "Siti",
            nik: "3201010101010102",
            jenisKelamin: "Perempuan",
            tempatLahir: null,
            tanggalLahir: null,
            hubunganDalamKk: "Istri",
            agama: null,
            pendidikan: null,
            pekerjaan: null,
            statusPerkawinan: null,
            isKepalaKeluarga: false,
            isActive: true,
            updatedAt: new Date("2026-04-04T00:00:00.000Z"),
          },
        ],
      },
      {
        id: "household-2",
        noKk: "3201010101010103",
        kepalaKeluarga: "Lengkap",
        alamat: "Jalan Kenanga 2",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        phone: "08123",
        statusTempatTinggal: "Kontrak",
        statusAktif: true,
        updatedAt: new Date("2026-04-03T00:00:00.000Z"),
        residents: [
          {
            id: "resident-3",
            namaLengkap: "Lengkap",
            nik: "3201010101010104",
            jenisKelamin: "Laki-laki",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1991-01-01T00:00:00.000Z"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Wiraswasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
            isActive: true,
            updatedAt: new Date("2026-04-03T00:00:00.000Z"),
          },
        ],
      },
    ]);

    expect(queue.households).toHaveLength(1);
    expect(queue.households[0]).toMatchObject({
      id: "household-1",
      href: "/dashboard/kk/household-1",
      status: "warning",
    });
    expect(queue.residents).toHaveLength(1);
    expect(queue.residents[0]).toMatchObject({
      id: "resident-2",
      href: "/dashboard/warga/resident-2",
      status: "critical",
    });
  });

  it("sorts critical items ahead of warnings", () => {
    const queue = buildCompletenessQueue([
      {
        id: "household-1",
        noKk: "3201010101010101",
        kepalaKeluarga: "Budi",
        alamat: "Jalan Melati 1",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        phone: "08123",
        statusTempatTinggal: "Kontrak",
        statusAktif: true,
        updatedAt: new Date("2026-04-05T00:00:00.000Z"),
        residents: [
          {
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
            isActive: true,
            updatedAt: new Date("2026-04-05T00:00:00.000Z"),
          },
        ],
      },
      {
        id: "household-2",
        noKk: "3201010101010102",
        kepalaKeluarga: "Siti",
        alamat: "Jalan Kenanga 2",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        phone: null,
        statusTempatTinggal: null,
        statusAktif: true,
        updatedAt: new Date("2026-04-04T00:00:00.000Z"),
        residents: [
          {
            id: "resident-2",
            namaLengkap: "Siti",
            nik: "3201010101010102",
            jenisKelamin: "Perempuan",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1992-01-01T00:00:00.000Z"),
            hubunganDalamKk: "Kepala Keluarga",
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Wiraswasta",
            statusPerkawinan: "Kawin",
            isKepalaKeluarga: true,
            isActive: true,
            updatedAt: new Date("2026-04-04T00:00:00.000Z"),
          },
        ],
      },
    ]);

    expect(queue.households.map((item: { id: string }) => item.id)).toEqual([
      "household-1",
      "household-2",
    ]);
  });
});
