import { expect, test } from "@playwright/test";

import { loginAsAdmin, makeUniqueDigits } from "./helpers";

test.describe("household smoke flow", () => {
  test("admin can create and find a household", async ({ page }) => {
    const noKk = makeUniqueDigits();
    const nik = makeUniqueDigits(Date.now() + 55_555);

    await loginAsAdmin(page);

    await page.goto("/dashboard/kk/new");
    await page.getByLabel("Nomor KK").fill(noKk);
    await page.getByLabel("RT").fill("01");
    await page.getByLabel("RW").fill("02");
    await page.getByLabel("Kode Pos").fill("40615");
    await page.getByLabel("Alamat").fill("Jalan Melati No. 17");
    await page.getByLabel("Kelurahan").fill("Cibiru");
    await page.getByLabel("Kecamatan").fill("Cibiru");
    await page.getByLabel("Kota / Kabupaten").fill("Bandung");
    await page.getByLabel("Provinsi").fill("Jawa Barat");
    await page
      .getByRole("button", { name: "Simpan & lanjut tambah anggota" })
      .click();

    await page.waitForURL(/\/dashboard\/kk\/.*\/warga\/new\?onboarding=1$/);
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
    await page.getByLabel("Status Perkawinan").fill("Kawin");
    await page.getByLabel("Status Tinggal").fill("Tetap");
    await page.getByText("Jadikan kepala keluarga").click();
    await page.getByLabel("Agama").fill("Islam");
    await page.getByLabel("Pendidikan").fill("SMA");
    await page.getByLabel("Pekerjaan").fill("Wiraswasta");
    await page.getByRole("button", { name: "Simpan & selesai" }).click();

    await page.waitForURL(/\/dashboard\/kk\/[^/]+$/);
    await expect(
      page.getByRole("heading", { name: `KK ${noKk}` }),
    ).toBeVisible();
    await expect(
      page.getByText("Budi Santoso", { exact: true }).first(),
    ).toBeVisible();

    await page.goto(`/dashboard/pencarian?q=${noKk}`);
    await expect(page.getByText(`No. KK ${noKk}`)).toBeVisible();
    await page.getByRole("button", { name: "Lihat detail" }).click();
    await expect(
      page.getByRole("heading", { name: `KK ${noKk}` }),
    ).toBeVisible();
  });
});
