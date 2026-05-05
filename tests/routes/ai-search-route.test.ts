const authMock = vi.fn();
const householdFindManyMock = vi.fn();
const residentFindManyMock = vi.fn();
const fileAssetFindManyMock = vi.fn();
const interpretAdminAiSearchQueryMock = vi.fn();
const filterAdminAiSearchResultsMock = vi.fn();

vi.mock("~/server/auth", () => ({ auth: authMock }));
vi.mock("~/server/db", () => ({
  db: {
    household: { findMany: householdFindManyMock },
    resident: { findMany: residentFindManyMock },
    fileAsset: { findMany: fileAssetFindManyMock },
  },
}));
vi.mock("~/server/ai/search", () => ({
  interpretAdminAiSearchQuery: interpretAdminAiSearchQueryMock,
  filterAdminAiSearchResults: filterAdminAiSearchResultsMock,
}));

describe("POST /api/ai/search", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    householdFindManyMock.mockReset();
    residentFindManyMock.mockReset();
    fileAssetFindManyMock.mockReset();
    interpretAdminAiSearchQueryMock.mockReset();
    filterAdminAiSearchResultsMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockImplementation(
      (handler: (request: Request & { auth?: null }) => Promise<Response>) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: null })),
    );
    const { POST } = await import("~/app/api/ai/search/route");
    const response = await POST(
      new Request("http://localhost/api/ai/search", {
        method: "POST",
        body: JSON.stringify({ query: "cari data" }),
      }),
    );

    expect(response.status).toBe(401);
  });

  it("returns validation errors for short prompts", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    const { POST } = await import("~/app/api/ai/search/route");
    const response = await POST(
      new Request("http://localhost/api/ai/search", {
        method: "POST",
        body: JSON.stringify({ query: "ok" }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns interpreted intent and grouped results", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    interpretAdminAiSearchQueryMock.mockResolvedValue({
      answer: "Saya menemukan 1 warga aktif.",
      entityScope: "resident",
      keywords: ["ani"],
      activeOnly: true,
    });
    householdFindManyMock.mockResolvedValue([]);
    residentFindManyMock.mockResolvedValue([
      {
        id: "resident-1",
        namaLengkap: "Ani",
        nik: "3201",
        hubunganDalamKk: "Anak",
        isActive: true,
        jenisKelamin: "Perempuan",
        tempatLahir: null,
        tanggalLahir: null,
        agama: null,
        pendidikan: null,
        pekerjaan: null,
        statusPerkawinan: null,
        files: [],
        household: { id: "household-1", noKk: "320101" },
      },
    ]);
    fileAssetFindManyMock.mockResolvedValue([]);
    filterAdminAiSearchResultsMock.mockReturnValue({
      households: [],
      residents: [
        {
          id: "resident-1",
          namaLengkap: "Ani",
          href: "/dashboard/warga/resident-1",
        },
      ],
      documents: [],
    });

    const { POST } = await import("~/app/api/ai/search/route");
    const response = await POST(
      new Request("http://localhost/api/ai/search", {
        method: "POST",
        body: JSON.stringify({ query: "warga aktif ani" }),
      }),
    );

    expect(interpretAdminAiSearchQueryMock).toHaveBeenCalledWith(
      "warga aktif ani",
    );
    expect(filterAdminAiSearchResultsMock).toHaveBeenCalled();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      intent: {
        answer: "Saya menemukan 1 warga aktif.",
        entityScope: "resident",
        keywords: ["ani"],
        activeOnly: true,
      },
      results: {
        households: [],
        residents: [
          {
            id: "resident-1",
            namaLengkap: "Ani",
            href: "/dashboard/warga/resident-1",
          },
        ],
        documents: [],
      },
    });
  });
});
