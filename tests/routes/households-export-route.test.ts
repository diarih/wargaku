const authMock = vi.fn();
const findManyMock = vi.fn();

vi.mock("~/server/auth", () => ({ auth: authMock }));
vi.mock("~/server/db", () => ({
  db: { household: { findMany: findManyMock } },
}));

describe("GET /api/households/export", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    findManyMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockImplementation(
      (handler: (request: Request & { auth?: null }) => Promise<Response>) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: null })),
    );
    const { GET } = await import("~/app/api/households/export/route");
    const response = await GET(
      new Request("http://localhost/api/households/export"),
    );

    expect(response.status).toBe(401);
  });

  it("exports filtered households as csv", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    findManyMock.mockResolvedValue([
      {
        noKk: "3201010101010101",
        kepalaKeluarga: 'Siti "Aminah"',
        alamat: "Jalan Melati, No. 17",
        rt: "01",
        rw: "02",
        kelurahan: "Cibiru",
        kecamatan: "Cibiru",
        kota: "Bandung",
        provinsi: "Jawa Barat",
        kodePos: null,
        statusTempatTinggal: "Kontrak",
        phone: null,
        statusAktif: true,
        residents: [
          {
            id: "resident-1",
            nik: "3201010101010102",
            namaLengkap: "Siti Aminah",
            jenisKelamin: "Perempuan",
            tempatLahir: "Bandung",
            tanggalLahir: new Date("1990-01-01"),
            hubunganDalamKk: "Kepala Keluarga",
            isKepalaKeluarga: true,
            agama: "Islam",
            pendidikan: "SMA/SMK/Sederajat",
            pekerjaan: "Wiraswasta",
            statusPerkawinan: "Kawin",
          },
        ],
        _count: { residents: 1 },
      },
    ]);

    const { GET } = await import("~/app/api/households/export/route");
    const response = await GET(
      new Request("http://localhost/api/households/export?housing=invalid"),
    );
    const csv = await response.text();

    expect(response.headers.get("Content-Type")).toContain("text/csv");
    expect(csv).toContain('"Jalan Melati, No. 17"');
    expect(csv).toContain('"Siti Aminah"');
    expect(findManyMock).toHaveBeenCalled();
  });
});
