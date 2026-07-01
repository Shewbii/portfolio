import { type Page, expect, test } from '@playwright/test'
import { createLoginToken, sampleJpeg } from './helpers'

const CLIENT = 'cli.e2e@test.fr'
const waitPost = (page: Page) =>
  page.waitForResponse((r) => r.request().method() === 'POST')

test('album privé : anonyme redirigé, client connecté, favori persistant, ZIP sélection', async ({
  page,
}) => {
  // Créer l'album + uploader une photo
  await page.goto('/admin')
  await page.getByPlaceholder('Titre de l’album').fill('Privé E2E')
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Créer l’album' }).click(),
  ])
  await expect(
    page.getByRole('link', { name: 'Privé E2E', exact: true }),
  ).toBeVisible()

  await page.getByRole('combobox').click()
  await page.getByRole('option', { name: 'Album : Privé E2E' }).click()
  await page.locator('input[name="files"]').setInputFiles({
    name: 'p.jpg',
    mimeType: 'image/jpeg',
    buffer: await sampleJpeg({ r: 150, g: 80, b: 80 }),
  })
  await page.getByRole('button', { name: 'Uploader' }).click()
  await expect(page.getByText('Photo ajoutée.')).toBeVisible()

  // Assigner le client
  await page.goto('/admin/albums/prive-e2e')
  await page.locator('input[name="clientEmail"]').fill(CLIENT)
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Enregistrer l’accès' }).click(),
  ])

  // Rendre privé (DOM frais)
  await page.goto('/admin/albums/prive-e2e')
  await page.getByRole('checkbox', { name: 'Public' }).click()
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Enregistrer', exact: true }).click(),
  ])

  // Visiteur anonyme -> redirigé vers /login
  await page.goto('/albums/prive-e2e')
  await expect(page).toHaveURL(/\/login/)

  // Connexion réelle par magic link (jeton forgé en base)
  const token = await createLoginToken(CLIENT)
  await page.goto(`/login/verify?token=${token}`)
  await expect(page).toHaveURL(/\/mes-albums/)
  await expect(
    page.getByRole('link', { name: 'Privé E2E', exact: true }),
  ).toBeVisible()

  // Ouvrir l'album
  await page.getByRole('link', { name: 'Privé E2E', exact: true }).click()
  await expect(page).toHaveURL(/\/albums\/prive-e2e/)
  await expect(page.locator('main img').first()).toBeVisible()

  // Favori : clic puis persistance après rechargement
  await Promise.all([
    waitPost(page),
    page.getByRole('button', { name: 'Ajouter aux favoris' }).first().click(),
  ])
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Retirer des favoris' }).first(),
  ).toBeVisible()

  // Téléchargement de la sélection
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('link', { name: /Télécharger ma sélection/ }).click(),
  ])
  expect(download.suggestedFilename()).toBe('prive-e2e-selection.zip')
})
