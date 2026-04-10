export function csvEscape(value: string | number | boolean | null | undefined) {
  const stringValue = value == null ? "" : String(value);
  return `"${stringValue.replaceAll('"', '""')}"`;
}
