import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['./tests/integration/env-setup.ts'],
    globalSetup: ['./tests/integration/global-setup.ts'],
    // Une seule base partagée : pas de parallélisme entre fichiers.
    fileParallelism: false,
    pool: 'forks',
    testTimeout: 20000,
  },
  resolve: {
    alias: { '@': root },
  },
})
