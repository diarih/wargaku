import { Prisma } from "@prisma/client";

const authMock = vi.fn();
const transactionMock = vi.fn();
const updateManyMock = vi.fn();
const updateMock = vi.fn();
const syncHeadMock = vi.fn();

vi.mock("~/server/auth", () => ({ auth: authMock }));
vi.mock("~/server/db", () => ({ db: { $transaction: transactionMock } }));
vi.mock("~/server/household-head", () => ({
  syncHouseholdHeadOfFamily: syncHeadMock,
}));

describe("PATCH /api/residents/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    transactionMock.mockReset();
    updateManyMock.mockReset();
    updateMock.mockReset();
    syncHeadMock.mockReset();
    transactionMock.mockImplementation(
      async (
        callback: (tx: {
          resident: {
            updateMany: typeof updateManyMock;
            update: typeof updateMock;
          };
        }) => unknown,
      ) =>
        callback({
          resident: { updateMany: updateManyMock, update: updateMock },
        }),
    );
  });

  it("updates a resident and syncs the household head", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
          context: { params: Record<string, string> },
        ) => Promise<Response>,
      ) =>
        (request: Request, context: { params: Record<string, string> }) =>
          handler(
            Object.assign(request, { auth: { user: { id: "user-1" } } }),
            context,
          ),
    );
    updateMock.mockResolvedValue({ householdId: "household-1" });

    const { PATCH } = await import("~/app/api/residents/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/residents/resident-1", {
        method: "PATCH",
        body: JSON.stringify({
          householdId: "household-1",
          nik: "3201010101010102",
          namaLengkap: "Budi Santoso",
          jenisKelamin: "Laki-laki",
          tempatLahir: "Bandung",
          tanggalLahir: "1990-01-01",
          hubunganDalamKk: "Anak",
          isKepalaKeluarga: true,
          isActive: true,
        }),
      }),
      { params: { id: "resident-1" } } as never,
    );

    expect(updateManyMock).toHaveBeenCalled();
    expect(syncHeadMock).toHaveBeenCalledWith(
      expect.any(Object),
      "household-1",
    );
    await expect(response.json()).resolves.toEqual({
      redirectTo: "/dashboard/kk/household-1",
    });
  });

  it("maps duplicate nik errors to 409 responses", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
          context: { params: Record<string, string> },
        ) => Promise<Response>,
      ) =>
        (request: Request, context: { params: Record<string, string> }) =>
          handler(
            Object.assign(request, { auth: { user: { id: "user-1" } } }),
            context,
          ),
    );
    updateMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const { PATCH } = await import("~/app/api/residents/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/residents/resident-1", {
        method: "PATCH",
        body: JSON.stringify({
          householdId: "household-1",
          nik: "3201010101010102",
          namaLengkap: "Budi Santoso",
          jenisKelamin: "Laki-laki",
          tempatLahir: "Bandung",
          tanggalLahir: "1990-01-01",
          hubunganDalamKk: "Anak",
          isKepalaKeluarga: false,
          isActive: true,
        }),
      }),
      { params: { id: "resident-1" } } as never,
    );

    expect(response.status).toBe(409);
  });
});
