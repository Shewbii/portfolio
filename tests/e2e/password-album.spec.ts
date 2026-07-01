import { type Page, expect, test } from '@playwright/test'
import { sampleJpeg } from './helpers'

const waitPost = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === 'POST')

test('album protégé par mot de passe : mauvais puis bon mot de passe', async ({
  page,
}) => {
  // Créer l'album + uploader une photo
  await page.goto('/admin')
  await page.getByPlaceholder('Titre de l’album').fill('Motdepasse E2E')
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Créer l’album' }).click(),
  ])
  await expect(
    page.getByRole('link', { name: 'Motdepasse E2E', exact: true }),
  ).toBeVisible()

  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Album : Motdepasse E2E' }).click()
  await page.locator('input[name="files"]').setInputFiles({
    name: 'm.jpg',
    mimeType: 'image/jpeg',
    buffer: await sampleJpeg({ r: 120, g: 100, b: 60 }),
  })
  await page.getByRole('button', { name: 'Uploader' }).click()
  await expect(page.getByText('Photo ajoutée.')).toBeVisible()

  // Rendre privé
  await page.goto('/admin/albums/motdepasse-e2e')
  await page.getByRole('checkbox', { name: 'Public' }).click()
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Enregistrer', exact: true }).click(),
  ])

  // Définir un mot de passe (DOM frais)
  await page.goto('/admin/albums/motdepasse-e2e')
  await page.locator('input[name="password"]').fill('secret42')
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Enregistrer le mot de passe' }).click(),
  ])
  await page.goto('/admin/albums/motdepasse-e2e')
  await expect(page.getByText('défini', { exact: true })).toBeVisible()

  // Visiteur : formulaire + mauvais mot de passe
  await page.goto('/albums/motdepasse-e2e')
  await expect(page.getByText('Cet album est protégé')).toBeVisible()
  await page.getByPlaceholder('Mot de passe').fill('mauvais')
  await page.getByRole('button', { name: 'Accéder à l’album' }).click()
  await expect(page.getByText('Mot de passe incorrect.')).toBeVisible()

  // Bon mot de passe -> galerie
  await page.getByPlaceholder('Mot de passe').fill('secret42')
  await page.getByRole('button', { name: 'Accéder à l’album' }).click()
  await expect(page.locator('main img').first()).toBeVisible()
})
