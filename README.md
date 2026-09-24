# nuxt-request-context

Resolve server-side data for an incoming HTML request and make it available to your Nuxt app before it renders.
Read it with `useRequestContext()`, with types inferred from your provider.

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

export default defineRequestContextProvider(async (event) => {
  const user = await getPublicUserFromSession(event)
  return { user }
})
```

Read the user with `useRequestContext()`:

```ts
const { user } = useRequestContext()
// user: { id: string; name: string } | null
```

For app files without auto-imports, or app files also checked by Nitro's server TypeScript configuration, import the composable explicitly:

```ts
import { useRequestContext } from "#nuxt-request-context/client"

const { user } = useRequestContext()
```

This composable runs in the Nuxt app.
Use [`getRequestContext(event)`](#server-access) in Nitro server code.

## Behavior

When Nitro serves HTML dynamically, the provider runs once per request with SSR or `ssr: false`, and the module embeds the context in the HTML.

Client-side navigation keeps the initial value; reload the page to get a new one after login or logout.
The value is not reactive and must be [serializable by devalue](https://github.com/sveltejs/devalue).
Treat the result as read-only while rendering so the server and browser receive the same value.

For prerendered pages, the provider runs at build time.
Every visitor receives the same context, so do not prerender pages that need per-user data.

## Server access

Nitro plugins can read the prepared context from the current `H3Event` with `getRequestContext(event)`.
Its return type is inferred from the provider, just like `useRequestContext()`.

```ts
// server/plugins/head.ts
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook("render:html", (html, { event }) => {
    const { user } = getRequestContext(event)
    if (user) html.head.push('<meta name="signed-in" content="true">')
  })
})
```

Use it after the provider has run, such as in `render:html`.
It throws if no context was prepared for the event.

## Security

Everything your provider returns is sent to the requesting visitor's browser.
Return only data that visitor may see, and never include credentials or server-only fields.
Disable shared caching of HTML and Nuxt payloads, including CDN caching, for pages with per-user context.
Keep server-only data outside the provider result and read it separately in your server code.

## Errors

If the provider throws or its result cannot be serialized, the module responds with a static HTTP 500 page.
Optionally pass `onError(error, event)` in the second argument to report the error or customize the response:

- Return an HTML string for the 500 page.
- Return a response object to set the status, headers, or body.
- Return nothing to keep the default 500 page, for example after only reporting the error.

A response object replaces the default page and uses status 500 if you omit `statusCode`.
Only redirect to a page that can load when the provider fails.

For example, report the error and redirect to `/error`:

```ts
export default defineRequestContextProvider(resolveContext, {
  onError(error, event) {
    reportErrorToSentry(error)
    return { statusCode: 302, headers: { Location: "/error" } }
  },
})
```
