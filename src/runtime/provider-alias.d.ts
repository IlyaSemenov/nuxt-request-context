declare module "#nuxt-request-context/provider" {
  import type { RequestContextProvider } from "./provider"

  const provider: RequestContextProvider<unknown>
  export default provider
}
