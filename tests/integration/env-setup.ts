// Variables d'env pour les tests d'intégration : base ET dossier de stockage
// SÉPARÉS de la dev, pour ne jamais toucher tes vraies données.
process.env.DATABASE_URL = 'postgres://photos:photos@localhost:5432/photos_test'
process.env.AUTH_SECRET = 'test-secret-for-vitest'
process.env.STORAGE_DIR = './data/test-photos'
