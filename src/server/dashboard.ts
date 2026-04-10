export const ageBuckets = [
  { label: "Balita", min: 0, max: 5 },
  { label: "Anak", min: 6, max: 12 },
  { label: "Remaja", min: 13, max: 17 },
  { label: "Dewasa", min: 18, max: 59 },
  { label: "Lansia", min: 60, max: Infinity },
] as const;

export function getAgeInYears(date: Date | null, today = new Date()) {
  if (!date || Number.isNaN(date.getTime())) {
    return null;
  }

  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

export function getAgeDistribution(
  residents: { tanggalLahir: Date | null }[],
  today = new Date(),
) {
  const counts = ageBuckets.map((bucket) => ({ ...bucket, total: 0 }));
  let unknown = 0;

  for (const resident of residents) {
    const age = getAgeInYears(resident.tanggalLahir, today);

    if (age === null) {
      unknown += 1;
      continue;
    }

    const bucket = counts.find((item) => age >= item.min && age <= item.max);

    if (bucket) {
      bucket.total += 1;
    } else {
      unknown += 1;
    }
  }

  return { counts, unknown };
}

export function getLivingStatusSummary(
  households: { statusTempatTinggal: string | null }[],
) {
  let rent = 0;
  let nonRent = 0;
  let unknown = 0;

  for (const household of households) {
    const value = household.statusTempatTinggal?.trim();

    if (!value) {
      unknown += 1;
      continue;
    }

    if (value === "Kontrak" || value === "Sewa" || value === "Kost") {
      rent += 1;
    } else {
      nonRent += 1;
    }
  }

  return { rent, nonRent, unknown };
}

export function getPercent(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}
