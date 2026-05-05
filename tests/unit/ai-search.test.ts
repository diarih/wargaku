const chatWithQwenMock = vi.fn();
const isQwenConfiguredMock = vi.fn();

vi.mock("~/server/ai/qwen", () => ({
  chatWithQwen: chatWithQwenMock,
  isQwenConfigured: isQwenConfiguredMock,
}));

describe("AI search intent parsing", () => {
  beforeEach(() => {
    chatWithQwenMock.mockReset();
    isQwenConfiguredMock.mockReset();
  });

  it("normalizes common snake_case and lowercase field names from the model", async () => {
    isQwenConfiguredMock.mockReturnValue(true);
    chatWithQwenMock.mockResolvedValue(`
      {
        "answer": "Saya menemukan data yang perlu dirapikan.",
        "entityScope": "resident",
        "keywords": ["dirapikan"],
        "residentMissingFields": ["nama_lengkap", "status_perkawinan", "pekerjaan"]
      }
    `);

    const { interpretAdminAiSearchQuery } = await import("~/server/ai/search");
    const result = await interpretAdminAiSearchQuery(
      "data mana yang paling perlu dirapikan",
    );

    expect(result.residentMissingFields).toEqual([
      "namaLengkap",
      "statusPerkawinan",
      "pekerjaan",
    ]);
  });

  it("falls back to a keyword-only intent when the model is unavailable", async () => {
    isQwenConfiguredMock.mockReturnValue(false);

    const { interpretAdminAiSearchQuery } = await import("~/server/ai/search");
    const result = await interpretAdminAiSearchQuery(
      "warga aktif yang belum isi agama",
    );

    expect(result).toMatchObject({
      entityScope: "all",
      keywords: ["warga aktif yang belum isi agama"],
    });
  });

  it("maps broad repair prompts to household completeness statuses", async () => {
    isQwenConfiguredMock.mockReturnValue(true);
    chatWithQwenMock.mockResolvedValue(`
      {
        "answer": "Saya akan mencari data KK yang paling perlu dirapikan.",
        "entityScope": "all",
        "keywords": [],
        "householdCompletenessStatuses": ["critical", "perlu_dilengkapi"]
      }
    `);

    const { interpretAdminAiSearchQuery } = await import("~/server/ai/search");
    const result = await interpretAdminAiSearchQuery(
      "data mana yang paling perlu dirapikan",
    );

    expect(result).toMatchObject({
      entityScope: "household",
      householdCompletenessStatuses: ["critical", "warning"],
    });
  });
});
