/** Key used to store prepared data on the current request event. */
export const REQUEST_CONTEXT_KEY = "nuxt-request-context"

/** Request data and the representation embedded in its HTML response. */
export interface PreparedRequestContext<Context> {
  value: Context
  serialized: string
}
