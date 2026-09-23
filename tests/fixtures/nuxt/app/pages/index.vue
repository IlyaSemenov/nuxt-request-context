<script setup lang="ts">
import { readAppRequestContext } from "../request-context"

const context = useRequestContext()
const title: string = context.title
const sameContext = readAppRequestContext() === context

// @ts-expect-error The inferred title is a string.
const invalidTitle: number = context.title
void invalidTitle
</script>

<template>
  <main>
    <h1 id="context-title">{{ title }}</h1>
    <p id="context-path">{{ context.path }}</p>
    <p id="same-context">{{ sameContext }}</p>
  </main>
</template>
