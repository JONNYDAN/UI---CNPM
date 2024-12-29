export default defineNuxtConfig({
  ssr: true,
  modules: [
    '@nuxtjs/tailwindcss',
    'nuxt-icon',
    'nuxt-swiper',
    'nuxt-simple-robots',
  ],
  runtimeConfig: {
    public: {
      baseURL: 'https://otruyenapi.com/v1/api',
    },
  },
});
