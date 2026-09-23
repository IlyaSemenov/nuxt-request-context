import type { RouterConfig } from "@nuxt/schema"

import { useRequestContext } from "#imports"

export default <RouterConfig>{
  routes(routes) {
    if (!useRequestContext().title) throw new Error("Request context is missing in router options.")
    return [
      ...routes,
      {
        name: "request-path",
        path: "/:path(.*)*",
        component: () => import("./pages/index.vue"),
      },
    ]
  },
}
