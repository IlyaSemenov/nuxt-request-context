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

/** Configure the application provider that supplies context for Nuxt render requests. */
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
      throw new Error("nuxt-request-context: configure a provider file.")
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

    addServerPlugin(resolveModulePath("./runtime/plugin"))

    // App files can also be checked by Nitro, whose TypeScript aliases exclude #app.
    // Keep the composable's declaration independent of its Nuxt runtime imports.
    addTemplate({
      filename: "request-context/client.d.ts",
      src: resolveModulePath("../templates/client.d.ts"),
      write: true,
    })
    const client = addTemplate({
      filename: "request-context/client.js",
      src: resolveModulePath("../templates/client.js"),
      write: true,
    })
    addImports({ name: "useRequestContext", from: client.dst })

    // The base alias also matches subpaths, so register the specific aliases first.
    nuxt.options.alias["#nuxt-request-context/internal/client"] =
      resolveModulePath("./runtime/client")
    nuxt.options.alias["#nuxt-request-context/client"] = client.dst
    nuxt.options.alias["#nuxt-request-context/provider"] = providerPath
    nuxt.options.alias["#nuxt-request-context"] = resolveModulePath("./runtime/context")

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
      // Nitro bundles some app files, such as @nuxt/image providers, but rejects Vue app imports.
      // Resolve the explicit composable import to a stub there, and keep its app declaration.
      config.alias["#nuxt-request-context/client"] = resolveModulePath("./runtime/nitro-client")
      config.typescript ??= {}
      config.typescript.tsConfig ??= {}
      config.typescript.tsConfig.compilerOptions ??= {}
      config.typescript.tsConfig.compilerOptions.paths ??= {}
      config.typescript.tsConfig.compilerOptions.paths["#nuxt-request-context/client"] = [
        client.dst,
      ]
      // Resolve the generated re-export's Nuxt alias instead of externalizing it in development.
      config.externals ??= {}
      config.externals.inline ??= []
      config.externals.inline.push(server.dst)
    })
  },
})
