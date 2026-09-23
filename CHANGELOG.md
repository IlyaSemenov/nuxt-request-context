# nuxt-request-context

## 0.3.0

### Minor Changes

- 87cc6eb: Support importing `useRequestContext()` from `#nuxt-request-context/client` with inferred types in app files also checked by Nitro's server TypeScript configuration.

## 0.2.0

### Minor Changes

- 1eb7653: Add typed `getRequestContext(event)` access for Nitro server code.

### Patch Changes

- 1f756ab: Prepare request context when Nuxt renders extracted payload requests.

## 0.1.1

### Patch Changes

- 04036a4: Fix circular import errors when `useRequestContext()` is used during Nuxt startup.

## 0.1.0

### Minor Changes

- ad48ab1: Initial beta release.
