# syntax=docker/dockerfile:1

# 1) Dépendances
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# 2) Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3) Runtime (image minimale grâce à output: 'standalone')
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=8080

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

# Le build standalone n'embarque PAS public/ ni .next/static : on les copie.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Volume des photos (monté par Coolify sur l'hôte)
RUN mkdir -p /app/data/photos && chown -R nextjs:nodejs /app/data
VOLUME /app/data/photos

USER nextjs
EXPOSE 8080

CMD ["node", "server.js"]
