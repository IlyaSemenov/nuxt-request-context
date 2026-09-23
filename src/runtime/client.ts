import { parse } from "devalue"

import { REQUEST_CONTEXT_SCRIPT_ID } from "./config"

let parsed = false
let requestContext: unknown

/** Read the context embedded in the initial HTML response. */
export function readClientRequestContext(): unknown {
  if (!parsed) {
    const data = document.getElementById(REQUEST_CONTEXT_SCRIPT_ID)
    if (!data) throw new Error("nuxt-request-context: no request context data is available.")
    requestContext = parse(data.textContent ?? "")
    parsed = true
  }
  return requestContext
}
