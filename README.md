# Photo Portfolio

Portfolio photographe + (à venir) partage d'albums clients.
Stack : **Next.js 16** (App Router) · **Drizzle** + **Postgres** · **sharp** · déploiement **VPS + Coolify**.

## Roadmap

1. ✅ **Vitrine** : upload → dérivés sharp → galerie avec placeholder flou.
2. ✅ **Albums publics** + lightbox + confort admin (réordonner, couverture, supprimer).
3. ✅ **Auth client** (magic link) + albums privés (`expires_at`, mot de passe).
4. ✅ **Favoris** (`selections`) + **téléchargement ZIP HD** (en streaming).

Reste pour la prod : déploiement Coolife, Cloudflare devant, domaine Resend vérifié,
sauvegardes (dumps Postgres + `rclone` du volume vers R2/B2). Le ZIP est généré en
streaming à la volée ; `zip_jobs` n'est pas encore utilisée (pré-génération possible
plus tard si les téléchargements deviennent lourds).

## Développement local

Prérequis : Node 20+ et un Postgres accessible.

```bash
npm install
cp .env.example .env        # renseigner DATABASE_URL
npm run db:push             # crée les tables
npm run dev                 # http://localhost:3000
```

- Vitrine : `/`
- Upload (non protégé pour l'instant) : `/admin`

Les photos sont écrites dans `STORAGE_DIR` (`./data/photos` par défaut) et servies via
la route `/images/<key>/<variant>`.

## Architecture des images

- À l'upload, `lib/images.ts` génère : `original`, `web.webp` (2000px), `thumb.webp` (600px)
  et un `blurDataURL` base64 pour le placeholder.
- `next/image` est en `unoptimized` : on sert nos propres dérivés, Cloudflare les met en cache.
- La route `/images/...` envoie un `Cache-Control` immuable d'un an.

## Déploiement Coolife (VPS)

1. Pousser ce repo sur Git (GitHub/GitLab).
2. Sur le VPS : installer Coolife, ajouter une ressource **PostgreSQL** (1 clic).
3. Créer une application **Dockerfile** pointant sur le repo.
4. Variables d'environnement (secrets Coolife) :
   - `DATABASE_URL` → l'URL interne du Postgres Coolife
   - `STORAGE_DIR=/data/photos`
5. Monter un **volume persistant** : hôte `→ /data/photos` dans le conteneur.
6. Brancher le domaine via **Cloudflare** (proxy activé = CDN + SSL).
7. Première migration : `npm run db:push` (en local contre la base, ou via un job Coolife).

### Sauvegardes (à activer dès qu'il y a de vraies photos)

- Postgres : dumps planifiés par Coolife.
- Photos : `rclone` cron du volume `/data/photos` vers un bucket (R2 / B2).

## Notes

- `sharp` est un module natif : l'image Docker est en `node:alpine`, les binaires musl
  sont récupérés automatiquement par `npm ci`. Si un build échoue sur sharp, vérifier que
  `npm ci` tourne bien dans l'étape `deps` (même base Alpine que le runner).
- Le traitement d'images se fait dans la requête d'upload. Quand le volume grossira,
  le déporter dans un worker dédié (Coolife permet de lancer un second service).
