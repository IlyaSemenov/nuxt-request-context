import assert from "node:assert/strict"
import { spawn, spawnSync } from "node:child_process"
import { createServer } from "node:net"
import { resolve } from "node:path"
import { setTimeout as delay } from "node:timers/promises"

import { chromium } from "@playwright/test"
import { parse } from "devalue"

const root = resolve(import.meta.dir, "../..")
const fixture = resolve(root, "tests/fixtures/nuxt")
const entry = resolve(fixture, ".output/server/index.mjs")

function runNuxt(command: string, ssr: boolean) {
  const result = spawnSync(process.execPath, ["run", "nuxt", command, fixture], {
    cwd: root,
    env: { ...process.env, REQUEST_CONTEXT_TEST_SSR: String(ssr) },
    stdio: "inherit",
  })
  assert.equal(result.status, 0, `nuxt ${command} failed`)
}

async function availablePort(): Promise<number> {
  const server = createServer()
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })
  const address = server.address()
  assert(address && typeof address !== "string")
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  )
  return address.port
}

async function checkMode(ssr: boolean) {
  runNuxt("build", ssr)
  if (ssr) runNuxt("typecheck", ssr)

  const port = await availablePort()
  const origin = `http://127.0.0.1:${port}`
  const server = spawn("node", [entry], {
    cwd: fixture,
    env: { ...process.env, HOST: "127.0.0.1", PORT: String(port) },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let output = ""
  server.stdout.on("data", (chunk) => {
    output += chunk
  })
  server.stderr.on("data", (chunk) => {
    output += chunk
  })

  try {
    let ready = false
    for (let attempt = 0; attempt < 100; attempt++) {
      if (server.exitCode !== null) break
      try {
        const response = await fetch(origin)
        if (response.ok) {
          ready = true
          break
        }
      } catch {}
      await delay(200)
    }
    assert(ready, `Nitro did not start:\n${output}`)

    const browser = await chromium.launch()
    try {
      for (const path of ["/request-1", "/request-2"]) {
        const response = await fetch(origin + path)
        assert.equal(response.status, 200, `${path}: ${output}`)
        const html = await response.text()
        const serialized = html.match(
          /<script id="nuxt-request-context-data" type="application\/json">([^<]*)<\/script>/,
        )?.[1]
        assert(serialized, `${path}: context data is missing from HTML`)
        assert.deepEqual(parse(serialized), { title: `Page ${path}`, path })
        assert.equal(html.includes('id="context-title"'), ssr, `${path}: unexpected SSR output`)

        const page = await browser.newPage()
        try {
          await page.goto(origin + path)
          assert.equal(await page.locator("#context-title").textContent(), `Page ${path}`)
          assert.equal(await page.locator("#context-path").textContent(), path)
        } finally {
          await page.close()
        }
      }

      for (const [path, message] of [
        ["/custom-error", "Context unavailable"],
        ["/default-error", "Internal Server Error"],
      ] as const) {
        const response = await fetch(origin + path)
        assert.equal(response.status, 500, `${path}: ${output}`)
        const html = await response.text()
        assert(html.includes(message), `${path}: expected error page is missing`)
        assert(!html.includes("private detail"), `${path}: error detail leaked`)
      }

      const redirect = await fetch(origin + "/redirect", { redirect: "manual" })
      assert.equal(redirect.status, 302)
      assert.equal(redirect.headers.get("location"), "/error")

      const emptyError = await fetch(origin + "/empty-error")
      assert.equal(emptyError.status, 500)
      assert.equal(await emptyError.text(), "")
    } finally {
      await browser.close()
    }
    console.log(`${ssr ? "SSR" : "SPA"}: request context works in HTML and browser`)
  } finally {
    if (server.exitCode === null) {
      const exited = new Promise<void>((resolve) => server.once("exit", () => resolve()))
      server.kill()
      await exited
    }
  }
}

await checkMode(true)
await checkMode(false)
