import { isAbsolute, resolve } from "node:path"

import {
  addImports,
  addServerPlugin,
  addTemplate,
  createResolver,
  defineNuxtModule,
  resolveAlias,
} from "@nuxt/kit"
import type {} from "@nuxt/nitro-server/augments"

const { resolve: resolveModulePath } = createResolver(import.meta.url)

/** Configure the application provider that supplies public data for each HTML request. */
export interface ModuleOptions {
  provider: string
}

/** Register request context resolution and a typed Nuxt composable. */
export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "nuxt-request-context",
    compatibility: { nuxt: "~4.5.2" },
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
    nuxt.options.alias["#nuxt-request-context/provider"] = providerPath
    nuxt.options.alias["#nuxt-request-context/client"] = resolveModulePath("./runtime/client")
    nuxt.hook("nitro:config", (config) => {
      config.alias ??= {}
      config.alias["#nuxt-request-context/provider"] = providerPath
    })
    addServerPlugin(resolveModulePath("./runtime/plugin"))

    const composable = addTemplate({
      filename: "request-context/composable.ts",
      src: resolveModulePath("../templates/composable.ts"),
      write: true,
    })
    addImports({ name: "useRequestContext", from: composable.dst })
  },
})
