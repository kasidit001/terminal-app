// nuxt.config.ts
import cesium from 'vite-plugin-cesium'

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
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
    plugins: [cesium()],
  },
})
