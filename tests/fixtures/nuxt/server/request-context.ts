import { defineRequestContextProvider } from "nuxt-request-context/provider"

export default defineRequestContextProvider(
  async (event) => {
    if (event.path.endsWith("-error") || event.path === "/redirect") {
      throw new Error("private detail")
    }
    await new Promise((resolve) => setTimeout(resolve, 10))
    event.context.requestContextResolveCount = (event.context.requestContextResolveCount ?? 0) + 1
    return { title: `Page ${event.path}`, path: event.path }
  },
  {
    onError(error, event) {
      if (!(error instanceof Error) || error.message !== "private detail") {
        throw new Error("onError received an unexpected error")
      }
      if (event.path === "/custom-error") {
        return "<!DOCTYPE html><html><body><h1>Context unavailable</h1></body></html>"
      }
      if (event.path === "/redirect") {
        return { statusCode: 302, headers: { Location: "/error" } }
      }
      if (event.path === "/empty-error") return {}
    },
  },
)
