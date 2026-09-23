import type { H3Event } from "h3"
import type { RequestContextForProvider } from "nuxt-request-context/provider"

import type provider from "#nuxt-request-context/provider"

/** Read the context already prepared for this Nuxt render request. */
export declare function getRequestContext(
  event: H3Event,
): RequestContextForProvider<typeof provider>
