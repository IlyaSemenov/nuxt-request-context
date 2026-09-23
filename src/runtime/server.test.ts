import { expect, spyOn, test } from "bun:test"

import { parse } from "devalue"
import type { H3Event } from "h3"
import type { NitroApp } from "nitropack/types"

import { readClientRequestContext } from "./client"
import { REQUEST_CONTEXT_KEY } from "./context"
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

test("skips Nuxt payload requests", async () => {
  const resolvedPaths: string[] = []
  const reportedErrors: unknown[] = []
  const hooks = createHooks({
    resolve: (event: H3Event) => {
      resolvedPaths.push(event.path)
      throw new Error("provider should not run")
    },
    onError: (error: unknown) => {
      reportedErrors.push(error)
    },
  })

  for (const path of ["/foo/_payload.json", "/foo/_payload.js", "/foo/_payload.json?key=value"]) {
    const event = { path, context: {} } as H3Event
    const render = { event, response: undefined as unknown }
    await hooks.get("render:before")!(render)
    expect(render.response).toBeUndefined()
    expect(event.context[REQUEST_CONTEXT_KEY]).toBeUndefined()
  }

  expect(resolvedPaths).toEqual([])
  expect(reportedErrors).toEqual([])
})

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

  expect(request1.context[REQUEST_CONTEXT_KEY]).toMatchObject({
    value: { path: "/request1", text: "</script>" },
  })
  expect(request2.context[REQUEST_CONTEXT_KEY]).toMatchObject({
    value: { path: "/request2", text: "</script>" },
  })

  const request1Html = { head: [] as string[] }
  hooks.get("render:html")!(request1Html, { event: request1 })
  const script = request1Html.head[0]!
  const data = script.match(/<script[^>]*>(.*?)<\/script>/)?.[1]
  expect(parse(data!)).toEqual({ path: "/request1", text: "</script>" })
  expect(script.match(/<\/script>/g)).toHaveLength(1)

  const originalDocument = globalThis.document
  const element = { textContent: data }
  globalThis.document = { getElementById: () => element } as unknown as Document
  try {
    const browserContext = readClientRequestContext()
    expect(browserContext).toEqual({ path: "/request1", text: "</script>" })
    expect(readClientRequestContext()).toBe(browserContext)
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

test("reports serialization errors and returns the static 500 page", async () => {
  const reported: unknown[] = []
  const event = { context: {} } as H3Event
  const hooks = createHooks({
    resolve: () => ({ unsupported: () => "private detail" }),
    onError: (error: unknown, receivedEvent: H3Event) => {
      reported.push(error, receivedEvent)
    },
  })
  const render = { event, response: undefined as unknown }

  await hooks.get("render:before")!(render)

  expect(reported[0]).toBeInstanceOf(Error)
  expect(reported[1]).toBe(event)
  expect(render.response).toMatchObject({ statusCode: 500 })
  expect(render.response).toHaveProperty("body", expect.stringContaining("Internal Server Error"))
  expect(event.context[REQUEST_CONTEXT_KEY]).toBeUndefined()
  const html = { head: [] as string[] }
  hooks.get("render:html")!(html, { event })
  expect(html.head).toEqual([])
})

test("uses the static 500 page when onError throws", async () => {
  const error = new Error("private detail")
  const handlerError = new Error("reporting failed")
  const consoleError = spyOn(console, "error").mockImplementation(() => {})
  try {
    const hooks = createHooks({
      resolve: () => {
        throw error
      },
      onError: () => {
        throw handlerError
      },
    })
    const render = { event: { context: {} } as H3Event, response: undefined as unknown }

    await hooks.get("render:before")!(render)

    expect(render.response).toMatchObject({ statusCode: 500 })
    expect(render.response).toHaveProperty("body", expect.stringContaining("Internal Server Error"))
    expect(consoleError).toHaveBeenCalledTimes(2)
  } finally {
    consoleError.mockRestore()
  }
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
