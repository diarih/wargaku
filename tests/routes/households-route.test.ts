import { Prisma } from "@prisma/client";

let sessionMock: { user?: { id: string } } | null = null;
const authMock = vi.fn((arg?: unknown) => {
  if (typeof arg === "function") {
    return (request: Request, context?: unknown) =>
      arg(Object.assign(request, { auth: sessionMock }), context);
  }

  return Promise.resolve(sessionMock);
});
const createMock = vi.fn();
const recordAuditEventMock = vi.fn();

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

vi.mock("~/server/audit", () => ({
  recordAuditEvent: recordAuditEventMock,
}));

describe("POST /api/households", () => {
  beforeEach(() => {
    sessionMock = null;
    authMock.mockClear();
    createMock.mockReset();
    recordAuditEventMock.mockReset();
  });

  it("returns 401 when the request is unauthenticated", async () => {
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
    sessionMock = { user: { id: "user-1" } };

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
    sessionMock = { user: { id: "user-1" } };
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
    expect(recordAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        entityId: "household-1",
        entityType: "HOUSEHOLD",
        householdId: "household-1",
        summary: "KK 3201010101010101 dibuat.",
        type: "HOUSEHOLD_CREATED",
      }),
    );
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      householdId: "household-1",
      redirectTo: "/dashboard/kk/household-1/warga/new?onboarding=1",
    });
  });

  it("maps duplicate kk errors to 409 responses", async () => {
    sessionMock = { user: { id: "user-1" } };
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
