// nuxt.config.ts
import cesium from 'vite-plugin-cesium'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  ssr: false,
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config',
    exposeConfig: false,
    viewer: true,
  },
  vite: {
    plugins: [cesium() as any],
  },
  // Load xterm.js from CDN — no npm install required
  app: {
    head: {
      link: [
        {
          rel: 'stylesheet',
          href: 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css',
        },
      ],
      script: [
        // Core xterm (exposes window.Terminal)
        {
          src: 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/lib/xterm.min.js',
          defer: false,
        },
        // FitAddon (exposes window.FitAddon.FitAddon)
        {
          src: 'https://cdn.jsdelivr.net/npm/@xterm/addon-fit@0.10.0/lib/addon-fit.min.js',
          defer: false,
        },
        // WebLinksAddon (exposes window.WebLinksAddon.WebLinksAddon)
        {
          src: 'https://cdn.jsdelivr.net/npm/@xterm/addon-web-links@0.11.0/lib/addon-web-links.min.js',
          defer: false,
        },
      ],
    },
  },
})

