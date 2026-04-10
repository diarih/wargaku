import { expect, test } from "@playwright/test";

import {
  createHouseholdAndHead,
  loginAsAdmin,
  makeUniqueDigits,
} from "./helpers";

test.describe("household smoke flow", () => {
  test("admin can create and find a household", async ({ page }) => {
    await loginAsAdmin(page);
    const { noKk } = await createHouseholdAndHead(page);

    await expect(
      page.getByRole("heading", { name: `KK ${noKk}` }),
    ).toBeVisible();
    await expect(
      page.getByText("Budi Santoso", { exact: true }).first(),
    ).toBeVisible();

    await page.goto(`/dashboard/kk?q=${noKk}`);
    const householdCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText(`No. KK ${noKk}`) })
      .first();

    await expect(householdCard.getByText(`No. KK ${noKk}`)).toBeVisible();
    await householdCard.getByRole("button", { name: "Lihat detail" }).click();
    await expect(
      page.getByRole("heading", { name: `KK ${noKk}` }),
    ).toBeVisible();
  });

  test("admin can create an incomplete resident and see kelengkapan warning", async ({
    page,
  }) => {
    const noKk = makeUniqueDigits();

    await loginAsAdmin(page);
    await page.goto("/dashboard/kk/new");
    await page.getByLabel("Nomor KK").fill(noKk);
    await page.getByLabel("RT").fill("01");
    await page.getByLabel("RW").fill("02");
    await page.getByLabel("Alamat").fill("Jalan Nusa Indah No. 5");
    await page.getByLabel("Kelurahan").fill("Cibiru");
    await page.getByLabel("Kecamatan").fill("Cibiru");
    await page.getByLabel("Kota / Kabupaten").fill("Bandung");
    await page.getByLabel("Provinsi").fill("Jawa Barat");
    await page
      .getByRole("button", { name: "Simpan & lanjut tambah anggota" })
      .click();

    await expect(page).toHaveURL(
      /\/dashboard\/kk\/.*\/warga\/new\?onboarding=1$/,
    );
    await page.getByLabel("Nama Lengkap").fill("Ani");
    await page.getByLabel("NIK").fill(makeUniqueDigits(Date.now() + 33333));
    await page.getByLabel("Jenis Kelamin").selectOption("Perempuan");
    await page.getByLabel("Tempat Lahir").fill("Bandung");
    await page.getByLabel("Tanggal Lahir").fill("2000-01-01");
    await page.getByLabel("Hubungan Dalam KK").selectOption("Anak");
    await page.getByRole("button", { name: "Simpan & selesai" }).click();

    await expect(page).toHaveURL(/\/dashboard\/kk\/[^/]+$/);
    await expect(page.getByText("Kelengkapan Data")).toBeVisible();
    await expect(page.getByText(/perlu dilengkapi/i).first()).toBeVisible();
    await expect(
      page.getByText(/status tempat tinggal belum diisi/i),
    ).toBeVisible();
    await expect(
      page.getByText(/kepala keluarga belum dipilih/i).first(),
    ).toBeVisible();
  });

  test("admin can upload and delete a household document", async ({ page }) => {
    await loginAsAdmin(page);
    const { noKk } = await createHouseholdAndHead(page);
    const uniqueFileName = `kk-scan-${noKk.slice(-6)}.pdf`;
    const uniqueSearchTerm = `kk-scan-${noKk.slice(-6)}`;

    await page.locator('input[type="file"]').setInputFiles({
      name: uniqueFileName,
      mimeType: "application/pdf",
      buffer: Buffer.from("dokumen-kk"),
    });
    await page.getByRole("button", { name: "Upload berkas" }).click();
    await expect(
      page.getByText(`Berkas ${uniqueFileName} berhasil diunggah.`),
    ).toBeVisible();
    await page.reload();

    const detailDocumentCard = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText("Dokumen KK") })
      .first();

    await expect(detailDocumentCard.getByText(uniqueFileName)).toBeVisible();

    await page.goto(`/dashboard/dokumen?q=${uniqueSearchTerm}`);

    const documentRow = page
      .locator('[data-slot="card"]')
      .filter({ has: page.getByText(uniqueFileName) })
      .first();

    await expect(documentRow.getByText(uniqueFileName)).toBeVisible({
      timeout: 15000,
    });
    await expect(documentRow.getByText(`KK ${noKk}`)).toBeVisible();
    await expect(documentRow.getByText("Dokumen KK")).toBeVisible();

    await documentRow.getByRole("button", { name: "Buka KK" }).click();
    await expect(
      page.getByRole("heading", { name: `KK ${noKk}` }),
    ).toBeVisible();
    await page.getByRole("button", { name: /^Hapus$/ }).click();
    await page.getByRole("button", { name: "Ya, hapus" }).click();

    await expect(
      page.getByText(`Berkas ${uniqueFileName} berhasil dihapus.`),
    ).toBeVisible();

    await expect(
      detailDocumentCard.getByText(uniqueFileName),
    ).not.toBeVisible();

    await page.goto(`/dashboard/dokumen?q=${uniqueSearchTerm}`);
    await expect(page.getByText("Belum ada dokumen")).toBeVisible();
  });
});
