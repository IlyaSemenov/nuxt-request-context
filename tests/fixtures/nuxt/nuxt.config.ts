export default defineNuxtConfig({
  modules: [["nuxt-request-context", { provider: "./server/request-context.ts" }]],
  ssr: process.env.REQUEST_CONTEXT_TEST_SSR !== "false",
  devtools: { enabled: false },
  compatibilityDate: "2026-09-23",
})
