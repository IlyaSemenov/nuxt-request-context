import type { RequestContextForProvider } from "nuxt-request-context/provider"

// Avoid the Nuxt app barrel, which can create a cycle during app initialization.
import { useRequestEvent } from "#app/composables/ssr"
import { getRequestContext } from "#nuxt-request-context"
import { readClientRequestContext } from "#nuxt-request-context/client"
import type provider from "#nuxt-request-context/provider"

type RequestContext = RequestContextForProvider<typeof provider>

/** Read the context resolved for the initial page load. */
export function useRequestContext(): RequestContext {
  if (import.meta.client) return readClientRequestContext() as RequestContext
  const event = useRequestEvent()
  if (!event) throw new Error("nuxt-request-context: no request event is available.")
  return getRequestContext<RequestContext>(event)
}
