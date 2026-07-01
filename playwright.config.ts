import { defineConfig, devices } from '@playwright/test'

const PORT = 3100
const BASE_URL = `http://localhost:${PORT}`
const TEST_DB_URL = 'postgres://photos:photos@localhost:5432/photos_e2e'

export default defineConfig({
  testDir: './tests/e2e',
  // Une seule base partagée : pas de parallélisme.
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npm run dev -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 180_000,
    // On force la base + le stockage de test (les vraies vars .env ne les écrasent pas).
    env: {
      ...process.env,
      DATABASE_URL: TEST_DB_URL,
      AUTH_SECRET: 'test-secret-e2e',
      STORAGE_DIR: './data/e2e-photos',
      APP_URL: BASE_URL,
    },
  },
})
