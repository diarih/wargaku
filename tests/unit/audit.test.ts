import {
  buildAuditFallbackFileEvents,
  buildAuditTimeline,
  getAuditEventLabel,
} from "~/server/audit";

describe("audit helpers", () => {
  it("labels known audit event types for timeline display", () => {
    expect(getAuditEventLabel("HOUSEHOLD_CREATED")).toBe("KK dibuat");
    expect(getAuditEventLabel("RESIDENT_UPDATED")).toBe("Warga diperbarui");
    expect(getAuditEventLabel("DOCUMENT_DELETED")).toBe("Dokumen dihapus");
  });

  it("merges audit rows and fallback events newest first", () => {
    const timeline = buildAuditTimeline({
      auditEvents: [
        {
          id: "audit-1",
          type: "HOUSEHOLD_UPDATED",
          summary: "Data KK diperbarui.",
          actorName: null,
          createdAt: new Date("2024-01-10T10:00:00.000Z"),
          metadata: null,
        },
      ],
      fallbackEvents: [
        {
          id: "fallback-created",
          type: "HOUSEHOLD_CREATED",
          summary: "KK dibuat dari data yang sudah ada.",
          actorName: "Sistem",
          createdAt: new Date("2024-01-01T10:00:00.000Z"),
          metadata: null,
          fallbackKey: "household:household-1:created",
        },
        {
          id: "fallback-file",
          type: "DOCUMENT_UPLOADED",
          summary: "Dokumen lama.pdf tersedia.",
          actorName: null,
          createdAt: new Date("2024-01-15T10:00:00.000Z"),
          metadata: { fileName: "lama.pdf" },
          fallbackKey: "file:file-1:uploaded",
        },
      ],
    });

    expect(timeline.map((item) => item.id)).toEqual([
      "fallback-file",
      "audit-1",
      "fallback-created",
    ]);
    expect(timeline[1]).toMatchObject({
      actorName: "Petugas",
      label: "KK diperbarui",
      source: "audit",
    });
  });

  it("skips fallback entries when a matching audit event exists", () => {
    const timeline = buildAuditTimeline({
      auditEvents: [
        {
          id: "audit-upload",
          type: "DOCUMENT_UPLOADED",
          summary: "Dokumen kk.pdf diunggah.",
          actorName: "Admin",
          createdAt: new Date("2024-02-01T10:00:00.000Z"),
          metadata: { fallbackKey: "file:file-1:uploaded" },
        },
      ],
      fallbackEvents: [
        {
          id: "fallback-file",
          type: "DOCUMENT_UPLOADED",
          summary: "Dokumen kk.pdf tersedia.",
          actorName: "Sistem",
          createdAt: new Date("2024-02-01T10:00:00.000Z"),
          metadata: { fileName: "kk.pdf" },
          fallbackKey: "file:file-1:uploaded",
        },
      ],
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.id).toBe("audit-upload");
  });

  it("builds fallback document upload events from existing file rows", () => {
    expect(
      buildAuditFallbackFileEvents([
        {
          id: "file-1",
          fileName: "ktp.pdf",
          createdAt: new Date("2024-03-01T10:00:00.000Z"),
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        type: "DOCUMENT_UPLOADED",
        summary: "Dokumen ktp.pdf tersedia.",
        fallbackKey: "file:file-1:uploaded",
        metadata: { fileName: "ktp.pdf" },
      }),
    ]);
  });
});
