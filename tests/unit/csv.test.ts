import { csvEscape } from "~/server/csv";

describe("csvEscape", () => {
  it("wraps values and escapes quotes", () => {
    expect(csvEscape('Halo, "Warga"')).toBe('"Halo, ""Warga"""');
  });

  it("normalizes nullish values into empty strings", () => {
    expect(csvEscape(null)).toBe('""');
    expect(csvEscape(undefined)).toBe('""');
  });
});
