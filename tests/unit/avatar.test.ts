import { getInitials, getInitialsAvatarUrl } from "~/lib/avatar";

describe("avatar helpers", () => {
  it("builds initials from the first two words", () => {
    expect(getInitials("Siti Aminah")).toBe("SA");
  });

  it("falls back to KK when the name is empty", () => {
    expect(getInitials("   ")).toBe("KK");
    expect(getInitials(null)).toBe("KK");
  });

  it("encodes the avatar seed in the generated url", () => {
    expect(getInitialsAvatarUrl("Warga Ku")).toBe(
      "https://api.dicebear.com/9.x/initials/svg?seed=Warga%20Ku",
    );
  });
});
