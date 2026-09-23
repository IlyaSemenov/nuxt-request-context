import { useRequestContext } from "#nuxt-request-context/client"

/** Read app context from a module also checked by Nitro's TypeScript program. */
export function readAppRequestContext() {
  const context = useRequestContext()
  const title: string = context.title
  // @ts-expect-error Explicit imports must infer the provider's result.
  const invalidTitle: number = context.title
  // @ts-expect-error The provider does not return a missing field.
  void context.missing
  void title
  void invalidTitle
  return context
}
