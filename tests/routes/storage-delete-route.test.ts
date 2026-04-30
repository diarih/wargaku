const findUniqueMock = vi.fn();
const deleteMock = vi.fn();
const deleteObjectMock = vi.fn();
const authSessionMock = vi.fn();
const revalidatePathMock = vi.fn();
const recordAuditEventMock = vi.fn();

vi.mock("next/cache", () => ({ revalidatePath: revalidatePathMock }));
vi.mock("~/server/auth", () => ({ auth: authSessionMock }));
vi.mock("~/server/db", () => ({
  db: { fileAsset: { findUnique: findUniqueMock, delete: deleteMock } },
}));
vi.mock("~/server/storage", () => ({ deleteObject: deleteObjectMock }));
vi.mock("~/server/audit", () => ({
  recordAuditEvent: recordAuditEventMock,
}));

describe("DELETE /api/storage/[id]", () => {
  beforeEach(() => {
    vi.resetModules();
    findUniqueMock.mockReset();
    deleteMock.mockReset();
    deleteObjectMock.mockReset();
    authSessionMock.mockReset();
    revalidatePathMock.mockReset();
    recordAuditEventMock.mockReset();
  });

  it("returns 401 without a session", async () => {
    authSessionMock.mockResolvedValue(null);
    const { DELETE } = await import("~/app/api/storage/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/storage/file-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "file-1" }) },
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 for missing files", async () => {
    authSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueMock.mockResolvedValue(null);
    const { DELETE } = await import("~/app/api/storage/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/storage/file-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "file-1" }) },
    );

    expect(response.status).toBe(404);
  });

  it("keeps the DB record when storage deletion fails", async () => {
    authSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueMock.mockResolvedValue({
      id: "file-1",
      fileName: "kk.pdf",
      path: "household/1/kk.pdf",
      householdId: "household-1",
      residentId: null,
    });
    deleteObjectMock.mockRejectedValue(new Error("R2 gagal"));

    const { DELETE } = await import("~/app/api/storage/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/storage/file-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "file-1" }) },
    );

    expect(response.status).toBe(502);
    expect(deleteMock).not.toHaveBeenCalled();
  });

  it("deletes the DB row after storage deletion succeeds", async () => {
    authSessionMock.mockResolvedValue({ user: { id: "user-1" } });
    findUniqueMock.mockResolvedValue({
      id: "file-1",
      fileName: "kk.pdf",
      path: "household/1/kk.pdf",
      householdId: "household-1",
      residentId: null,
    });

    const { DELETE } = await import("~/app/api/storage/[id]/route");
    const response = await DELETE(
      new Request("http://localhost/api/storage/file-1", { method: "DELETE" }),
      { params: Promise.resolve({ id: "file-1" }) },
    );

    expect(deleteObjectMock).toHaveBeenCalledWith("household/1/kk.pdf");
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "file-1" } });
    expect(recordAuditEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: "user-1",
        entityId: "file-1",
        entityType: "DOCUMENT",
        fileAssetId: "file-1",
        householdId: "household-1",
        metadata: expect.objectContaining({ fileName: "kk.pdf" }),
        summary: "Dokumen kk.pdf dihapus.",
        type: "DOCUMENT_DELETED",
      }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/dashboard/dokumen");
    expect(response.status).toBe(200);
  });
});
