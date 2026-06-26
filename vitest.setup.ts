// Secret fixe pour que la signature des jetons soit déterministe en test.
// (chargé avant l'import des modules testés)
process.env.AUTH_SECRET = 'test-secret-for-vitest'
