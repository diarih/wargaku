import { expect, type Page } from "@playwright/test";

export async function loginAsAdmin(page: Page) {
  const username = process.env.PLAYWRIGHT_ADMIN_USERNAME ?? "playwright-admin";
  const password = process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "Playwright123!";

  if (!username || !password) {
    throw new Error(
      "Playwright credentials must be available to run browser tests.",
    );
  }

  await page.goto("/login");
  await page.getByLabel("Username").fill(username);
  await page.locator("#password").fill(password);
  await page.getByRole("button", { name: "Masuk ke Dashboard" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 20000 });
  await expect(
    page.getByText("Selamat datang di pusat pendataan warga."),
  ).toBeVisible({ timeout: 20000 });
}

export function makeUniqueDigits(seed = Date.now()) {
  const random = `${seed}${Math.floor(Math.random() * 10_000)}`;
  return random.slice(0, 16).padEnd(16, "7");
}

export async function createHouseholdAndHead(page: Page) {
  const noKk = makeUniqueDigits();
  const nik = makeUniqueDigits(Date.now() + 55_555);

  await page.goto("/dashboard/kk/new");
  await page.getByLabel("Nomor KK").fill(noKk);
  await page.getByLabel("RT").fill("01");
  await page.getByLabel("RW").fill("02");
  await page.getByLabel("Kode Pos").fill("40615");
  await page.getByLabel("Nomor Telepon KK").fill("08123456789");
  await page.getByLabel("Alamat").fill("Jalan Melati No. 17");
  await page.getByLabel("Kelurahan").fill("Cibiru");
  await page.getByLabel("Kecamatan").fill("Cibiru");
  await page.getByLabel("Kota / Kabupaten").fill("Bandung");
  await page.getByLabel("Provinsi").fill("Jawa Barat");
  await page.getByLabel("Status Tempat Tinggal").selectOption("Kontrak");
  await page
    .getByRole("button", { name: "Simpan & lanjut tambah anggota" })
    .click();

  await expect(page).toHaveURL(
    /\/dashboard\/kk\/.*\/warga\/new\?onboarding=1$/,
  );
  await expect(
    page.getByText(
      "Data KK sudah tersimpan. Lanjutkan dengan menambahkan anggota keluarga pertama.",
    ),
  ).toBeVisible();

  await page.getByLabel("Nama Lengkap").fill("Budi Santoso");
  await page.getByLabel("NIK").fill(nik);
  await page.getByLabel("Jenis Kelamin").selectOption("Laki-laki");
  await page.getByLabel("Tempat Lahir").fill("Bandung");
  await page.getByLabel("Tanggal Lahir").fill("1990-01-01");
  await page.getByLabel("Status Perkawinan").selectOption("Kawin");
  await page.getByLabel("Agama").selectOption("Islam");
  await page.getByLabel("Pendidikan").selectOption("SMA/SMK/Sederajat");
  await page.getByLabel("Pekerjaan").selectOption("Wiraswasta");
  await page.getByText("Jadikan kepala keluarga").click();
  await page.getByRole("button", { name: "Simpan & selesai" }).click();

  if (/\/warga\/new\?onboarding=1$/.test(page.url())) {
    await page
      .getByRole("button", { name: "Selesai dan buka detail KK" })
      .click();
  }

  await expect(page).toHaveURL(/\/dashboard\/kk\/[^/]+$/, { timeout: 20000 });

  return { noKk, nik, householdUrl: page.url() };
}
