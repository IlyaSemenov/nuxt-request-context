// Avoid the Nuxt app barrel, which can create a cycle during app initialization.
import { useRequestEvent } from "#app/composables/ssr"
import { getRequestContext } from "#nuxt-request-context"
import { readClientRequestContext } from "#nuxt-request-context/internal/client"

/** Read the prepared context in a Nuxt app. */
export function useRequestContext() {
  if (import.meta.client) return readClientRequestContext()
  const event = useRequestEvent()
  if (!event) throw new Error("nuxt-request-context: no request event is available.")
  return getRequestContext(event)
}
