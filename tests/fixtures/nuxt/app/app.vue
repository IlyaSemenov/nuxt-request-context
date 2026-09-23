<script setup lang="ts">
const context = useRequestContext()
const title: string = context.title

// @ts-expect-error The inferred title is a string.
const invalidTitle: number = context.title
void invalidTitle
</script>

<template>
  <main>
    <h1 id="context-title">{{ title }}</h1>
    <p id="context-path">{{ context.path }}</p>
  </main>
</template>
