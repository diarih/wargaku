import {
  getAgeDistribution,
  getAgeInYears,
  getLivingStatusSummary,
  getPercent,
} from "~/server/dashboard";

describe("dashboard helpers", () => {
  const today = new Date("2026-04-08T12:00:00.000Z");

  it("calculates age safely for valid and future dates", () => {
    expect(getAgeInYears(new Date("2000-04-07"), today)).toBe(26);
    expect(getAgeInYears(new Date("2030-01-01"), today)).toBeNull();
    expect(getAgeInYears(null, today)).toBeNull();
  });

  it("groups residents into age buckets and unknown values", () => {
    const distribution = getAgeDistribution(
      [
        { tanggalLahir: new Date("2024-01-01") },
        { tanggalLahir: new Date("2018-01-01") },
        { tanggalLahir: new Date("1970-01-01") },
        { tanggalLahir: null },
      ],
      today,
    );

    expect(
      distribution.counts.find((item) => item.label === "Balita")?.total,
    ).toBe(1);
    expect(
      distribution.counts.find((item) => item.label === "Anak")?.total,
    ).toBe(1);
    expect(
      distribution.counts.find((item) => item.label === "Dewasa")?.total,
    ).toBe(1);
    expect(distribution.unknown).toBe(1);
  });

  it("summarizes rent and unknown living statuses", () => {
    expect(
      getLivingStatusSummary([
        { statusTempatTinggal: "Kontrak" },
        { statusTempatTinggal: "Milik Sendiri" },
        { statusTempatTinggal: "   " },
      ]),
    ).toEqual({ rent: 1, nonRent: 1, unknown: 1 });
  });

  it("returns zero percent when there is no total", () => {
    expect(getPercent(3, 0)).toBe(0);
    expect(getPercent(1, 4)).toBe(25);
  });
});
