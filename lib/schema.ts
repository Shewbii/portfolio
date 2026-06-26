import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// --- Étape 1 : seules `photos` (is_portfolio) sont utilisées. ---
// Les autres tables sont définies dès maintenant pour les étapes suivantes
// (albums privés, favoris, ZIP) afin de ne migrer qu'une fois.

export const clients = pgTable('clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const albums = pgTable('albums', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  clientId: uuid('client_id').references(() => clients.id),
  status: text('status').notNull().default('draft'), // draft | published | archived
  isPublic: boolean('is_public').notNull().default(false),
  passwordHash: text('password_hash'),
  expiresAt: timestamp('expires_at'),
  coverPhotoId: uuid('cover_photo_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const photos = pgTable('photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  albumId: uuid('album_id').references(() => albums.id),
  storageKey: text('storage_key').notNull(),
  width: integer('width').notNull(),
  height: integer('height').notNull(),
  blurDataUrl: text('blur_data_url').notNull(),
  originalFormat: text('original_format'), // 'jpeg' | 'png' | 'webp'… pour nommer le ZIP
  isPortfolio: boolean('is_portfolio').notNull().default(false),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const selections = pgTable(
  'selections',
  {
    albumId: uuid('album_id')
      .notNull()
      .references(() => albums.id),
    photoId: uuid('photo_id')
      .notNull()
      .references(() => photos.id),
    clientId: uuid('client_id')
      .notNull()
      .references(() => clients.id),
  },
  (t) => [primaryKey({ columns: [t.albumId, t.photoId, t.clientId] })],
)

// Jetons de connexion magic-link (on stocke le HASH du jeton, jamais le brut).
export const loginTokens = pgTable('login_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clients.id),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const zipJobs = pgTable('zip_jobs', {
  id: uuid('id').defaultRandom().primaryKey(),
  albumId: uuid('album_id')
    .notNull()
    .references(() => albums.id),
  status: text('status').notNull().default('pending'), // pending | building | ready | error
  storageKey: text('storage_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
