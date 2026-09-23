import type { H3Event } from "h3"

/** Key used to store prepared data on the current request event. */
export const REQUEST_CONTEXT_KEY = "nuxt-request-context"

/** Request data and the representation embedded in its HTML response. */
export interface PreparedRequestContext<Context> {
  value: Context
  serialized: string
}

/** Read the context prepared for this event, or fail if preparation has not completed. */
export function getRequestContext<Context>(event: H3Event): Context {
  const prepared = event.context[REQUEST_CONTEXT_KEY] as PreparedRequestContext<Context> | undefined
  if (!prepared) {
    throw new Error("nuxt-request-context: no request context was prepared for this event.")
  }
  return prepared.value
}
