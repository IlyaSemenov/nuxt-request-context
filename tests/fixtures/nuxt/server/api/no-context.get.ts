export default defineEventHandler((event) => {
  try {
    getRequestContext(event)
  } catch (error) {
    if (error instanceof Error) return error.message
    throw error
  }
  throw new Error("getRequestContext() unexpectedly found context in an API request.")
})
