// Bundle an app file into Nitro, as @nuxt/image does with app image providers.
import { readAppRequestContext } from "../../app/request-context"

export default defineEventHandler(() => {
  try {
    readAppRequestContext()
  } catch (error) {
    if (error instanceof Error) return error.message
    throw error
  }
  throw new Error("useRequestContext() unexpectedly returned context in Nitro server code.")
})
