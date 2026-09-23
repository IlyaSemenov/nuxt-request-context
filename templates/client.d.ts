import type { RequestContextForProvider } from "nuxt-request-context/provider"

import type provider from "#nuxt-request-context/provider"

/** Read the prepared context in a Nuxt app. */
export declare function useRequestContext(): RequestContextForProvider<typeof provider>
