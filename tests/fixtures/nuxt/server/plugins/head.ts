import { getRequestContext as getImportedRequestContext } from "#imports"

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("render:html", (html, { event }) => {
    const context = getRequestContext(event)
    const path: string = context.path
    const importedContext = getImportedRequestContext(event)
    const importedPath: string = importedContext.path
    // @ts-expect-error Explicit imports must also infer the provider's result.
    void importedContext.missing
    if (importedContext !== context || importedPath !== path) {
      throw new Error("Explicit and automatic imports must read the same request context.")
    }
    // @ts-expect-error The provider does not return a missing field.
    void context.missing
    html.head.push(
      `<meta name="request-context-path" content="${path}" data-resolves="${event.context.requestContextResolveCount}">`,
    )
  })
})
