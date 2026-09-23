import { defineNitroPlugin } from "nitropack/runtime"

import provider from "#nuxt-request-context/provider"

import { setupRenderRequestContext } from "./server"

export default defineNitroPlugin((nitro) => setupRenderRequestContext(nitro, provider))
