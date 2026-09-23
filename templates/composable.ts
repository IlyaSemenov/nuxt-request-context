import type { RequestContextForProvider } from "nuxt-request-context/provider"
import { useRequestEvent } from "nuxt/app"

import { REQUEST_CONTEXT_KEY, type PreparedRequestContext } from "#nuxt-request-context"
import { readClientRequestContext } from "#nuxt-request-context/client"
import type provider from "#nuxt-request-context/provider"

type RequestContext = RequestContextForProvider<typeof provider>

/** Read the public context prepared for the current HTML request. */
export function useRequestContext(): RequestContext {
  if (import.meta.client) return readClientRequestContext() as RequestContext
  const event = useRequestEvent()
  if (!event) throw new Error("nuxt-request-context: no request event is available.")
  const prepared = event.context[REQUEST_CONTEXT_KEY] as
    | PreparedRequestContext<RequestContext>
    | undefined
  if (!prepared) throw new Error("nuxt-request-context: no request context was prepared.")
  return prepared.value
}
