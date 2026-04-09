import { syncHouseholdHeadOfFamily } from "~/server/household-head";

describe("syncHouseholdHeadOfFamily", () => {
  it("updates the household with the latest head of family name", async () => {
    const findFirst = vi.fn().mockResolvedValue({ namaLengkap: "Siti Aminah" });
    const update = vi.fn().mockResolvedValue(undefined);

    await syncHouseholdHeadOfFamily(
      {
        resident: { findFirst },
        household: { update },
      } as never,
      "household-1",
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: { householdId: "household-1", isKepalaKeluarga: true },
      orderBy: { updatedAt: "desc" },
      select: { namaLengkap: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: "household-1" },
      data: { kepalaKeluarga: "Siti Aminah" },
    });
  });

  it("clears the household head when none is flagged", async () => {
    const update = vi.fn().mockResolvedValue(undefined);

    await syncHouseholdHeadOfFamily(
      {
        resident: { findFirst: vi.fn().mockResolvedValue(null) },
        household: { update },
      } as never,
      "household-2",
    );

    expect(update).toHaveBeenCalledWith({
      where: { id: "household-2" },
      data: { kepalaKeluarga: "" },
    });
  });
});
