# nuxt-request-context Agent Guide

## Overview

Provide typed request data for each Nuxt HTML request before Vue rendering.

Read [README.md](README.md) completely before changing the public API, package behavior, supported runtimes, or user documentation.

Extend this guide only with stable, non-obvious conventions, architecture, contracts, workflows, and gotchas.
Do not catalog files or restate information evident from their names and locations.

## Scope

- Keep runtime code in `src/` and the generated Nuxt composable source in `templates/`.
- Keep focused module tests beside their source as `*.test.ts`.
- Keep integration, package-boundary, and type-inference tests in `tests/`.
- Name compile-only tests `*.type-test.ts`.
- Keep `src/module.ts` as the Nuxt module entry and declare public exports explicitly.
- Treat `package.json` exports and supported runtimes as public contracts.

## Runtime

- Keep the `./provider` export and derive the generated `useRequestContext()` return type from the provider's `resolve()` result.
- Generate server runtime templates as JavaScript with adjacent declarations so Nitro can bundle them from Nuxt's `node_modules` cache and preserve types for explicit imports.
- Keep the generated composable's declarations independent of `#app` so app files can also be checked by Nitro's TypeScript program.
- Resolve the provider before Vue renders each HTML request.
- Store the value on the current request event and serialize it into the module-owned HTML data element in `head` for the browser.

## Documentation

- Write public README and JSDoc text for package users who do not know the implementation.
- Add JSDoc to every exported declaration and to internal helpers whose contract, inputs, output, or failure behavior is not obvious.
- Add inline comments beside every non-obvious invariant, algorithmic choice, safety constraint, and intentionally limited behavior.
- Update nearby JSDoc and inline comments whenever the documented code changes, and remove comments that no longer apply.
- Do not narrate self-evident syntax or restate what a name already communicates.
- Do not document obvious or implied defaults.
- Describe a default only when readers need it to make a decision or avoid surprising behavior.
- Use One Sentence Per Line for connected prose.
- Keep semantically connected explanations as prose paragraphs.
- Use lists for separate assertions instead of presenting them as prose paragraphs.

## Changesets

- Before the first publication, update `.changeset/initial-release.md` instead of adding another changeset.
- Add one `.changeset/*.md` file for each independently releasable user-visible change.
- Do not add changesets for internal refactors, maintenance, tests, or documentation changes that do not require a package release.
- Choose the SemVer bump from the public contract: `patch` for backward-compatible fixes, `minor` for backward-compatible functionality, and `major` for breaking changes.
- Create `.changeset/<unique-name>.md` with this format:

```markdown
---
"nuxt-request-context": patch
---

Describe the user-visible change.
```

- Briefly describe the user-observable change or new capability in the public contract, without implementation details or rationale.
  Prefer a single sentence.
- Do not edit the package version or `CHANGELOG.md` by hand, and do not run `changeset version` or `changeset publish`; the release workflow consumes pending changesets.

## Tests

- Add a `describe` block where the file gives a reason for it: several APIs or behaviors in one file, or a fixture that belongs to some cases but not all.
  Name such a block after what it covers and keep its fixtures inside it.
- Distinguish several same-kind values by role rather than by order.
  When values differ only by order, number them with digits instead of ordinal words.
- Keep tests deterministic so a failure repeats on every run.
  Generate random inputs from an explicit seed and print the seed in failure messages so the failing input can be replayed.

## Checks

- Run the `types` script when public types or TypeScript configuration change.
- Run the `test` script when behavior changes.
- Run the `build` script when package exports, declarations, or supported runtimes change.
- Run `test:nuxt` for changes to module registration, generated imports, or SSR and SPA HTML behavior.
