// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-mapbox',
    '@pinia/nuxt'
  ],
  mapbox: {
    accessToken: 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE' // Grab a free default public token from mapbox.com
  },
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config',
    exposeConfig: false,
    viewer: true,
  }
})