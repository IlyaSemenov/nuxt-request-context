import type { H3Event } from "h3"
import type { RenderContext } from "nitropack/types"

/** A response returned from an error handler instead of the default 500 page. */
export type RequestContextErrorResponse = NonNullable<RenderContext["response"]>

/** The error handler result; no result uses the default 500 page. */
export type RequestContextErrorResult = string | RequestContextErrorResponse | void

/** Resolve devalue-serializable data for one Nuxt render request. */
export type RequestContextResolver<Context> = (event: H3Event) => Context | Promise<Context>

/** Optional provider behavior. */
export interface RequestContextProviderOptions {
  /** Return HTML, a response, or nothing to use the default 500 page. */
  onError?(
    error: unknown,
    event: H3Event,
  ): RequestContextErrorResult | Promise<RequestContextErrorResult>
}

/** A provider created by defineRequestContextProvider(). */
export interface RequestContextProvider<Context> extends RequestContextProviderOptions {
  resolve: RequestContextResolver<Context>
}

/** Define a provider while inferring its context from the resolver result. */
export function defineRequestContextProvider<const Context>(
  resolve: RequestContextResolver<Context>,
  options: RequestContextProviderOptions = {},
): RequestContextProvider<Context> {
  return { ...options, resolve }
}

/** The resolved context of a provider. */
export type RequestContextForProvider<Provider extends RequestContextProvider<unknown>> = Awaited<
  ReturnType<Provider["resolve"]>
>
