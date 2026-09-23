# nuxt-request-context

Pass values from an incoming HTML request to your Nuxt app before it renders.
Read them with `useRequestContext()`, with types inferred from your provider.

The context is available on the initial load with SSR, `ssr: false`, or prerendering.

This addresses the problem described in Nuxt issue [#14915: Support custom payload for no-ssr pages](https://github.com/nuxt/nuxt/issues/14915) by embedding request data in the HTML response.

The package requires Nuxt 4.0.1 or newer.

## Quick start

```sh
npm install nuxt-request-context
```

Configure a provider in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [["nuxt-request-context", { provider: "./server/request-context.ts" }]],
})
```

For example, `server/request-context.ts` can use your own session helper to expose the signed-in user:

```ts
import { getPublicUserFromSession } from "./auth"
import { defineRequestContextProvider } from "nuxt-request-context/provider"

export default defineRequestContextProvider({
  async resolve(event) {
    const user = await getPublicUserFromSession(event)
    return { user }
  },
})
```

Read the user with `useRequestContext()`:

```ts
const { user } = useRequestContext()
// user: { id: string; name: string } | null
```

## Behavior

The provider runs once for each HTML request, and its result is embedded in that response.
Client-side navigation keeps the initial value; reload the page to get a new one after login or logout.
The value is not reactive and must be [serializable by devalue](https://github.com/sveltejs/devalue).
Treat the result as read-only while rendering so the server and browser receive the same value.

For prerendered pages, the provider runs at build time.

## Security

Everything your provider returns is sent to the requesting visitor's browser.
Return only data that visitor may see, and never include credentials or server-only fields.
Disable shared HTML caching, including CDN caching, for pages with per-user context.

## Errors

If `resolve()` fails or its result cannot be serialized, the module responds with a static HTTP 500 page.
Optionally provide `onError(error, event)` to report the error or customize the response:

- Return an HTML string for the 500 page.
- Return a response object to set the status, headers, or body.
  For example, `{ statusCode: 302, headers: { Location: "/error" } }` redirects to `/error`.

A response object replaces the default page and uses status 500 if you omit `statusCode`.
Only redirect to a page that can load when the provider fails.
