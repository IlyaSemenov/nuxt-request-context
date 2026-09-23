import type {} from "@nuxt/nitro-server/augments"
import { stringify } from "devalue"
import type { NitroApp } from "nitropack/types"

import { REQUEST_CONTEXT_SCRIPT_ID } from "./config"
import { REQUEST_CONTEXT_KEY, type PreparedRequestContext } from "./context"
import type { RequestContextErrorResponse, RequestContextProvider } from "./provider"

/** Prepare request context before Vue renders and embed it in the HTML response. */
export function setupRenderRequestContext<Context>(
  nitro: NitroApp,
  provider: RequestContextProvider<Context>,
) {
  nitro.hooks.hook("render:before", async (context) => {
    const { event } = context
    // Nuxt renders payload requests through this hook without producing HTML.
    if (/(?:^|\/)_payload\.(?:json|js)(?:\?.*)?$/.test(event.path)) return

    try {
      const requestContext = await provider.resolve(event)
      // Serialize here so onError also handles values that devalue cannot encode.
      const serialized = stringify(requestContext)
      event.context[REQUEST_CONTEXT_KEY] = { value: requestContext, serialized }
    } catch (error) {
      let response: RequestContextErrorResponse = {
        statusCode: 500,
        headers: { "content-type": "text/html; charset=utf-8" },
        body: "<!DOCTYPE html><html><head><meta charset='utf-8'><title>500</title></head><body><h1>Internal Server Error</h1></body></html>",
      }
      try {
        if (provider.onError) {
          const result = await provider.onError(error, event)
          if (typeof result === "string") response = { ...response, body: result }
          else if (result) response = { statusCode: 500, ...result }
        } else {
          console.error("Failed to prepare request context.", error)
        }
      } catch (handlerError) {
        console.error("Failed to report request context error.", handlerError)
        console.error("Failed to prepare request context.", error)
      }
      context.response = response
    }
  })

  nitro.hooks.hook("render:html", (html, { event }) => {
    const prepared = event.context[REQUEST_CONTEXT_KEY] as
      | PreparedRequestContext<Context>
      | undefined
    if (!prepared) return
    html.head.push(
      `<script id="${REQUEST_CONTEXT_SCRIPT_ID}" type="application/json">${prepared.serialized}</script>`,
    )
  })
}
