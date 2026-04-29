const authMock = vi.fn();
const createMock = vi.fn();
const uploadObjectMock = vi.fn();
const revalidatePathMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("~/server/auth", () => ({ auth: authMock }));
vi.mock("~/server/db", () => ({ db: { fileAsset: { create: createMock } } }));
vi.mock("~/server/storage", () => ({
  storageBucket: "wargaku-test",
  uploadObject: uploadObjectMock,
}));

describe("POST /api/storage/upload", () => {
  beforeEach(() => {
    vi.resetModules();
    authMock.mockReset();
    createMock.mockReset();
    uploadObjectMock.mockReset();
    revalidatePathMock.mockReset();
  });

  function makeSizedFile(name: string, type: string, size: number) {
    const file = new File(["hello"], name, { type });
    Object.defineProperty(file, "size", {
      configurable: true,
      value: size,
    });
    return file;
  }

  function makeRequest(formData: FormData) {
    return {
      formData: vi.fn().mockResolvedValue(formData),
    } as unknown as Request;
  }

  it("returns 401 when unauthenticated", async () => {
    authMock.mockImplementation(
      (handler: (request: Request & { auth?: null }) => Promise<Response>) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: null })),
    );
    const { POST } = await import("~/app/api/storage/upload/route");

    const formData = new FormData();
    formData.set(
      "file",
      new File(["hello"], "kk.pdf", { type: "application/pdf" }),
    );
    const response = await POST(makeRequest(formData));

    expect(response.status).toBe(401);
  });

  it("rejects oversized files", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    const { POST } = await import("~/app/api/storage/upload/route");

    const bigFile = makeSizedFile(
      "besar.pdf",
      "application/pdf",
      5 * 1024 * 1024 + 1,
    );
    const formData = new FormData();
    formData.set("file", bigFile);
    formData.set("householdId", "household-1");

    const response = await POST(makeRequest(formData));

    expect(response.status).toBe(400);
  });

  it("uploads to storage and persists file metadata", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    createMock.mockResolvedValue({
      id: "file-1",
      path: "household/household-1/random.pdf",
      bucket: "wargaku-test",
      fileName: "kk.pdf",
    });

    const { POST } = await import("~/app/api/storage/upload/route");
    const formData = new FormData();
    formData.set("file", makeSizedFile("kk.pdf", "application/pdf", 128));
    formData.set("householdId", "household-1");

    const response = await POST(makeRequest(formData));

    expect(uploadObjectMock).toHaveBeenCalled();
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          householdId: "household-1",
          uploadedById: "user-1",
        }),
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/dashboard/kk/household-1",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/dokumen");
    expect(response.status).toBe(200);
  });

  it("returns 500 when storage upload fails", async () => {
    authMock.mockImplementation(
      (
        handler: (
          request: Request & { auth?: { user: { id: string } } },
        ) => Promise<Response>,
      ) =>
        (request: Request) =>
          handler(Object.assign(request, { auth: { user: { id: "user-1" } } })),
    );
    uploadObjectMock.mockRejectedValue(new Error("R2 down"));

    const { POST } = await import("~/app/api/storage/upload/route");
    const formData = new FormData();
    formData.set("file", makeSizedFile("kk.pdf", "application/pdf", 128));
    formData.set("householdId", "household-1");

    const response = await POST(makeRequest(formData));

    expect(response.status).toBe(500);
    expect(createMock).not.toHaveBeenCalled();
  });
});
