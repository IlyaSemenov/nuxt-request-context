// Model a module such as @nuxt/image referencing an app file from server declarations.
/** App module whose types must resolve in Nitro's TypeScript program. */
export type AppContextModule = typeof import("../../app/request-context")
