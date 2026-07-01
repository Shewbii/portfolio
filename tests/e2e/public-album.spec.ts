import { expect, test } from '@playwright/test'
import { sampleJpeg } from './helpers'

test('album public : upload via l’UI, galerie, lightbox et téléchargement ZIP', async ({
  page,
}) => {
  // 1) Créer un album (public par défaut)
  await page.goto('/admin')
  await page.getByPlaceholder('Titre de l’album').fill('Public E2E')
  await page.getByRole('button', { name: 'Créer l’album' }).click()
  await expect(
    page.getByRole('link', { name: 'Public E2E', exact: true }),
  ).toBeVisible()

  // 2) Uploader une photo dans cet album
  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Album : Public E2E' }).click()
  await page
    .locator('input[name="files"]')
    .setInputFiles({ name: 'a.jpg', mimeType: 'image/jpeg', buffer: await sampleJpeg() })
  await page.getByRole('button', { name: 'Uploader' }).click()
  await expect(page.getByText('Photo ajoutée.')).toBeVisible()

  // 3) Page publique de l'album
  await page.goto('/albums/public-e2e')
  await expect(page.locator('main img').first()).toBeVisible()

  // 4) Lightbox
  await page.getByRole('button', { name: 'Agrandir la photo' }).first().click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toBeHidden()

  // 5) Téléchargement ZIP
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: 'Télécharger l’album' }).click(),
  ])
  expect(download.suggestedFilename()).toBe('public-e2e.zip')
})
