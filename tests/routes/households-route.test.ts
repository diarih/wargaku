import { Prisma } from "@prisma/client";

const authMock = vi.fn();
const createMock = vi.fn();

vi.mock("~/server/auth", () => ({
  auth: authMock,
}));

vi.mock("~/server/db", () => ({
  db: {
    household: {
      create: createMock,
    },
  },
}));

describe("POST /api/households", () => {
  beforeEach(() => {
    authMock.mockReset();
    createMock.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
    authMock.mockResolvedValue(null);

    const { POST } = await import("~/app/api/households/route");
    const response = await POST(
      new Request("http://localhost/api/households", {
        method: "POST",
        body: JSON.stringify({}),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "Unauthorized" });
  });

  it("returns validation errors as 400 responses", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });

    const { POST } = await import("~/app/api/households/route");
    const response = await POST(
      new Request("http://localhost/api/households", {
        method: "POST",
        body: JSON.stringify({ noKk: "123" }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: expect.stringContaining("Nomor KK harus terdiri dari 16 digit."),
    });
  });

  it("returns redirect payloads when the household is created", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createMock.mockResolvedValue({ id: "household-1" });

    const { POST } = await import("~/app/api/households/route");
    const response = await POST(
      new Request("http://localhost/api/households", {
        method: "POST",
        body: JSON.stringify({
          noKk: "3201010101010101",
          alamat: "Jalan Melati No. 17",
          rt: "01",
          rw: "02",
          kelurahan: "Cibiru",
          kecamatan: "Cibiru",
          kota: "Bandung",
          provinsi: "Jawa Barat",
          kodePos: "40615",
          statusAktif: true,
        }),
      }),
    );

    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          noKk: "3201010101010101",
          createdById: "user-1",
        }),
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      householdId: "household-1",
      redirectTo: "/dashboard/kk/household-1/warga/new?onboarding=1",
    });
  });

  it("maps duplicate kk errors to 409 responses", async () => {
    authMock.mockResolvedValue({ user: { id: "user-1" } });
    createMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Duplicate", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    const { POST } = await import("~/app/api/households/route");
    const response = await POST(
      new Request("http://localhost/api/households", {
        method: "POST",
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
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "Nomor KK sudah digunakan.",
    });
  });
});
