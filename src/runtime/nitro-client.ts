/** Reject app context reads from app files that Nitro bundles into server code. */
export function useRequestContext(): never {
  throw new Error(
    "nuxt-request-context: useRequestContext() runs only in the Nuxt app; use getRequestContext(event) in Nitro server code.",
  )
}
