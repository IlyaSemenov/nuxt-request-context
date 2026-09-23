---
"nuxt-request-context": patch
---

Allow Nitro to bundle app files that import `useRequestContext()` from `#nuxt-request-context/client`; calling it in Nitro server code throws.
