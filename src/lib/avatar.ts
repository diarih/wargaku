const DICEBEAR_BASE_URL = "https://api.dicebear.com/9.x/initials/svg";

export function getInitials(name: string | null | undefined) {
  const safeName = name?.trim();

  if (!safeName) {
    return "KK";
  }

  const parts = safeName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "");

  return parts.join("") || safeName.slice(0, 2).toUpperCase();
}

export function getInitialsAvatarUrl(seed: string | null | undefined) {
  const safeSeed = seed?.trim() ?? "Kartu Keluarga";
  return `${DICEBEAR_BASE_URL}?seed=${encodeURIComponent(safeSeed)}`;
}
