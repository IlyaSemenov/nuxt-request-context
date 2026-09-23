import type {} from "@nuxt/nitro-server/augments"
import { stringify } from "devalue"
import type { NitroApp } from "nitropack/types"

import { REQUEST_CONTEXT_SCRIPT_ID } from "./config"
import type { RequestContextErrorResponse, RequestContextProvider } from "./provider"

/** Готовит контекст до Vue renderer и передаёт его клиенту в HTML. */
export function setupRenderRequestContext<Context>(
  nitro: NitroApp,
  provider: RequestContextProvider<Context>,
) {
  nitro.hooks.hook("render:before", async (context) => {
    const { event } = context

    try {
      const requestContext = await provider.resolve(event)
      event.context.requestContext = requestContext
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
          console.error("Failed to resolve request context.", error)
        }
      } catch (handlerError) {
        console.error("Failed to report request context error.", handlerError)
        console.error("Failed to resolve request context.", error)
      }
      context.response = response
    }
  })

  nitro.hooks.hook("render:html", (html, { event }) => {
    const requestContext = event.context.requestContext as Context
    html.head.push(
      `<script id="${REQUEST_CONTEXT_SCRIPT_ID}" type="application/json">${stringify(requestContext)}</script>`,
    )
  })
}
