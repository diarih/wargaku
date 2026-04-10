import { Prisma } from "@prisma/client";

const authMock = vi.fn();
const updateMock = vi.fn();

vi.mock("~/server/auth", () => ({ auth: authMock }));
vi.mock("~/server/db", () => ({ db: { household: { update: updateMock } } }));

describe("PATCH /api/households/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    updateMock.mockReset();
  });

  it("returns 401 when unauthenticated", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: null },
          context: { params: Record<string, string> },
        ) => Promise<Response>,
      ) =>
        (request: Request, context: { params: Record<string, string> }) =>
          handler(Object.assign(request, { auth: null }), context),
    );

    const { PATCH } = await import("~/app/api/households/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/households/id", { method: "PATCH" }),
      { params: { id: "id" } } as never,
    );

    expect(response.status).toBe(401);
  });

  it("updates the household and returns a redirect", async () => {
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

    const { PATCH } = await import("~/app/api/households/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/households/household-1", {
        method: "PATCH",
        body: JSON.stringify({
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
          statusAktif: true,
        }),
      }),
      { params: { id: "household-1" } } as never,
    );

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "household-1" },
        data: expect.objectContaining({
          phone: "08123456789",
          statusTempatTinggal: "Kontrak",
        }),
      }),
    );
    await expect(response.json()).resolves.toEqual({
      redirectTo: "/dashboard/kk/household-1",
    });
  });

  it("maps duplicate kk errors to 409 responses", async () => {
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

    const { PATCH } = await import("~/app/api/households/[id]/route");
    const response = await PATCH(
      new Request("http://localhost/api/households/household-1", {
        method: "PATCH",
        body: JSON.stringify({
          noKk: "3201010101010101",
          alamat: "Jalan Melati No. 17",
          rt: "01",
          rw: "02",
          kelurahan: "Cibiru",
          kecamatan: "Cibiru",
          kota: "Bandung",
          provinsi: "Jawa Barat",
          statusAktif: true,
        }),
      }),
      { params: { id: "household-1" } } as never,
    );

    expect(response.status).toBe(409);
  });
});
