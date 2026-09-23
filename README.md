# nuxt-request-context

Make values from the incoming request available throughout your Nuxt app.
Define a provider that returns those values for each page load, then read the inferred result with `useRequestContext()`.

Unlike `useState()`, it makes request data available on the initial load even with `ssr: false`.

## Install

```sh
npm install nuxt-request-context
```

Configure a provider in `nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  modules: [["nuxt-request-context", { provider: "./server/request-context.ts" }]],
})
```

The path can be relative to the Nuxt root, absolute, or a Nuxt alias that resolves to a file.
For example, a provider can read the session and expose the signed-in user:

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

Every visitor can inspect context values in the HTML, so return only public data.

If `resolve()` fails, the module responds with a static HTTP 500 page.
Optionally provide `onError(error, event)` to report the error or customize the response:

- Return an HTML string for the 500 page.
- Return a response object to set the status, headers, or body.
  For example, `{ statusCode: 302, headers: { Location: "/error" } }` redirects to `/error`.
