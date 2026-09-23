import type { H3Event } from "h3"
import type { RenderContext } from "nitropack/types"

/** A response returned from an error handler instead of the default 500 page. */
export type RequestContextErrorResponse = NonNullable<RenderContext["response"]>

/** The error handler result; no result uses the default 500 page. */
export type RequestContextErrorResult = string | RequestContextErrorResponse | void

/** Supply public context data for one HTML request. */
export interface RequestContextProvider<Context> {
  resolve(event: H3Event): Context | Promise<Context>
  /** Return HTML, a response, or nothing to use the default 500 page. */
  onError?(
    error: unknown,
    event: H3Event,
  ): RequestContextErrorResult | Promise<RequestContextErrorResult>
}

/** Define a provider while inferring its context from resolve(). */
export function defineRequestContextProvider<
  const Provider extends RequestContextProvider<unknown>,
>(provider: Provider): Provider {
  return provider
}

/** The resolved public context of a provider. */
export type RequestContextForProvider<Provider extends RequestContextProvider<unknown>> = Awaited<
  ReturnType<Provider["resolve"]>
>
