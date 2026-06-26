import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Build autonome : image Docker minimale pour Coolife / Cloud Run
  output: 'standalone',
  images: {
    // On sert nos propres dérivés (générés par sharp) via Cloudflare.
    // Pas besoin de l'optimiseur Next : on garde juste le placeholder flou.
    unoptimized: true,
  },
}

export default nextConfig
