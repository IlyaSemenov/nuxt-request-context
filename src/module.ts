import { isAbsolute, resolve } from "node:path"

import {
  addImports,
  addServerImports,
  addServerPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolveAlias,
} from "@nuxt/kit"
import type {} from "@nuxt/nitro-server/augments"

const { resolve: resolveModulePath } = createResolver(import.meta.url)

/** Configure the application provider that supplies context for each HTML request. */
export interface ModuleOptions {
  provider: string
}

/** Register request context resolution and a typed Nuxt composable. */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-request-context",
    compatibility: { nuxt: "^4.0.1" },
  },
  defaults: { provider: "" },
  setup({ provider }, nuxt) {
    if (!provider) {
      throw new Error("nuxt-request-context: configure a provider with resolve(event).")
    }

    const aliasedPath = resolveAlias(provider, nuxt.options.alias)
    const providerPath = isAbsolute(aliasedPath)
      ? aliasedPath
      : aliasedPath.startsWith(".")
        ? resolve(nuxt.options.rootDir, aliasedPath)
        : undefined
    if (!providerPath) {
      throw new Error(`nuxt-request-context: provider ${provider} must resolve to a file path.`)
    }

    // The base alias also matches subpaths, so register the specific aliases first.
    nuxt.options.alias["#nuxt-request-context/client"] = resolveModulePath("./runtime/client")
    nuxt.options.alias["#nuxt-request-context/provider"] = providerPath
    nuxt.options.alias["#nuxt-request-context"] = resolveModulePath("./runtime/context")

    addServerPlugin(resolveModulePath("./runtime/plugin"))

    const composable = addTemplate({
      filename: "request-context/composable.ts",
      src: resolveModulePath("../templates/composable.ts"),
      write: true,
    })
    addImports({ name: "useRequestContext", from: composable.dst })

    // Nitro skips TypeScript transforms inside Nuxt's node_modules cache.
    // Adjacent declarations type both automatic and explicit imports of the JavaScript module.
    addTemplate({
      filename: "request-context/server.d.ts",
      src: resolveModulePath("../templates/server.d.ts"),
      write: true,
    })
    const server = addTemplate({
      filename: "request-context/server.js",
      getContents: () => 'export { getRequestContext } from "#nuxt-request-context"\n',
      write: true,
    })
    addServerImports({
      name: "getRequestContext",
      from: server.dst,
    })

    nuxt.hook("nitro:config", (config) => {
      config.alias ??= {}
      config.alias["#nuxt-request-context/provider"] = providerPath
      // Resolve the generated re-export's Nuxt alias instead of externalizing it in development.
      config.externals ??= {}
      config.externals.inline ??= []
      config.externals.inline.push(server.dst)
    })
  },
})
