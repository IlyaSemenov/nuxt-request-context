import { expect, test } from "bun:test"

import { parse } from "devalue"
import type { H3Event } from "h3"
import type { NitroApp } from "nitropack/types"

import { readClientRequestContext } from "./client"
import type { RequestContextProvider } from "./provider"
import { setupRenderRequestContext } from "./server"

function createHooks<Context>(provider: RequestContextProvider<Context>) {
  const hooks = new Map<string, (...args: any[]) => unknown>()
  setupRenderRequestContext(
    {
      hooks: {
        hook: (name: string, callback: (...args: any[]) => unknown) => hooks.set(name, callback),
      },
    } as unknown as NitroApp,
    provider,
  )
  return hooks
}

test("keeps each request's context separate and provides it to the browser", async () => {
  const hooks = createHooks({
    resolve: async (event: H3Event) => {
      await new Promise((resolve) => setTimeout(resolve, event.path === "/request1" ? 10 : 0))
      return { path: event.path, text: "</script>" }
    },
  })
  const request1 = { path: "/request1", context: {} } as H3Event
  const request2 = { path: "/request2", context: {} } as H3Event

  await Promise.all([
    hooks.get("render:before")!({ event: request1 }),
    hooks.get("render:before")!({ event: request2 }),
  ])

  expect(request1.context.requestContext).toEqual({ path: "/request1", text: "</script>" })
  expect(request2.context.requestContext).toEqual({ path: "/request2", text: "</script>" })

  const request1Html = { head: [] as string[] }
  hooks.get("render:html")!(request1Html, { event: request1 })
  const script = request1Html.head[0]!
  const data = script.match(/<script[^>]*>(.*?)<\/script>/)?.[1]
  expect(parse(data!)).toEqual({ path: "/request1", text: "</script>" })
  expect(script.match(/<\/script>/g)).toHaveLength(1)

  const originalDocument = globalThis.document
  globalThis.document = { getElementById: () => ({ textContent: data }) } as unknown as Document
  try {
    expect(readClientRequestContext()).toEqual({ path: "/request1", text: "</script>" })
  } finally {
    globalThis.document = originalDocument
  }
})

test("returns a static 500 when resolve fails and reports the original error", async () => {
  const error = new Error("private detail")
  const reported: unknown[] = []
  const hooks = createHooks({
    resolve: () => {
      throw error
    },
    onError: (received: unknown) => {
      reported.push(received)
    },
  })
  const render = { event: { context: {} } as H3Event, response: undefined as unknown }

  await hooks.get("render:before")!(render)

  expect(reported).toEqual([error])
  expect(render.response).toMatchObject({ statusCode: 500 })
  expect(render.response).toHaveProperty("body", expect.stringContaining("Internal Server Error"))
  expect(JSON.stringify(render.response)).not.toContain("private detail")
})

test("uses HTML returned by an async error handler", async () => {
  const error = new Error("private detail")
  const html = "<!DOCTYPE html><html><body><h1>Context unavailable</h1></body></html>"
  const event = { context: {} } as H3Event
  const reported: unknown[] = []
  const hooks = createHooks({
    resolve: () => {
      throw error
    },
    onError: async (received: unknown, receivedEvent: H3Event) => {
      await Promise.resolve()
      reported.push(received, receivedEvent)
      return html
    },
  })
  const render = { event, response: undefined as unknown }

  await hooks.get("render:before")!(render)

  expect(reported).toEqual([error, event])
  expect(render.response).toMatchObject({ statusCode: 500, body: html })
})

test("uses the response returned by an error handler", async () => {
  const hooks = createHooks({
    resolve: () => {
      throw new Error("private detail")
    },
    onError: () => ({ statusCode: 302, headers: { Location: "/error" } }),
  })
  const render = { event: { context: {} } as H3Event, response: undefined as unknown }

  await hooks.get("render:before")!(render)

  expect(render.response).toEqual({ statusCode: 302, headers: { Location: "/error" } })
})

test("defaults a returned response object to status 500", async () => {
  const hooks = createHooks({
    resolve: () => {
      throw new Error("private detail")
    },
    onError: () => ({}),
  })
  const render = { event: { context: {} } as H3Event, response: undefined as unknown }

  await hooks.get("render:before")!(render)

  expect(render.response).toEqual({ statusCode: 500 })
})
