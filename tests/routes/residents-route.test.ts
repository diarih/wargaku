import { Prisma } from "@prisma/client";

const authMock = vi.fn();
const transactionMock = vi.fn();
const updateManyMock = vi.fn();
const createMock = vi.fn();
const syncHeadMock = vi.fn();

vi.mock("~/server/auth", () => ({
  auth: authMock,
}));

vi.mock("~/server/db", () => ({
  db: {
    $transaction: transactionMock,
  },
}));

vi.mock("~/server/household-head", () => ({
  syncHouseholdHeadOfFamily: syncHeadMock,
}));

describe("POST /api/residents", () => {
  beforeEach(() => {
    authMock.mockReset();
    transactionMock.mockReset();
    updateManyMock.mockReset();
    createMock.mockReset();
    syncHeadMock.mockReset();

    transactionMock.mockImplementation(
      async (
        callback: (tx: {
          resident: {
            updateMany: typeof updateManyMock;
            create: typeof createMock;
          };
        }) => unknown,
      ) =>
        callback({
          resident: {
            updateMany: updateManyMock,
            create: createMock,
          },
        }),
    );
  });

  it("returns 401 when the request is unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const { POST } = await import("~/app/api/residents/route");
    const response = await POST(
      new Request("http://localhost/api/residents", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("returns redirect payloads and syncs the head of family on success", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createMock.mockResolvedValue({
      id: "resident-1",
      householdId: "household-1",
    });

    const { POST } = await import("~/app/api/residents/route");
    const response = await POST(
      new Request("http://localhost/api/residents", {
        method: "POST",
        body: JSON.stringify({
          householdId: "household-1",
          nik: "3201010101010102",
          namaLengkap: "Budi Santoso",
          jenisKelamin: "Laki-laki",
          tempatLahir: "Bandung",
          tanggalLahir: "1990-01-01",
          hubunganDalamKk: "Kepala Keluarga",
          isKepalaKeluarga: true,
          agama: "Islam",
          pendidikan: "SMA",
          pekerjaan: "Wiraswasta",
          statusPerkawinan: "Kawin",
          statusTinggal: "Tetap",
          phone: "08123456789",
          email: "budi@example.com",
          isActive: true,
        }),
      }),
    );

    expect(updateManyMock).toHaveBeenCalledWith({
      where: {
        householdId: "household-1",
        isKepalaKeluarga: true,
      },
      data: {
        isKepalaKeluarga: false,
      },
    });
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: "user-1",
          email: "budi@example.com",
        }),
      }),
    );
    expect(syncHeadMock).toHaveBeenCalledWith(
      expect.any(Object),
      "household-1",
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      redirectTo: "/dashboard/kk/household-1",
    });
  });

  it("maps duplicate nik errors to 409 responses", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const { POST } = await import("~/app/api/residents/route");
    const response = await POST(
      new Request("http://localhost/api/residents", {
        method: "POST",
        body: JSON.stringify({
          householdId: "household-1",
          nik: "3201010101010102",
          namaLengkap: "Budi Santoso",
          jenisKelamin: "Laki-laki",
          hubunganDalamKk: "Anak",
          isKepalaKeluarga: false,
          isActive: true,
        }),
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "NIK sudah digunakan.",
    });
  });
});
