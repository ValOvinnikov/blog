---
name: use-context7
description: >-
  How and when to pull live library documentation via the context7 MCP server.
  Use before implementing anything that depends on a specific library version,
  CLI flag, configuration format, or API shape — especially for packages that
  evolve quickly (Sanity v6, Next.js 16, Tailwind v4, Vitest). Apply whenever
  you are about to guess at an API rather than verify it.
---

# Use context7 for live documentation

Training data goes stale. context7 returns current, version-matched docs, so
code is written against the installed API rather than a remembered one.

## When to use it

Whenever you would otherwise guess:

- A CLI command or flag (`sanity schema extract`, `sanity typegen generate`,
  `sanity migrations`, `drizzle-kit`, pnpm workspace flags, `turbo.json` keys).
- A config format that changes between majors (`sanity.cli.ts`'s `typegen`
  block, `next.config.ts`, Tailwind v4 `@import`/`@source`, `vitest.config.ts`).
- An API whose signature, generics or import path may have moved
  (`defineType`/`defineField`/`defineArrayMember`, groqd builder methods,
  `client.fetch` options, Auth.js v5 callbacks).
- A deprecation hit mid-task — look up the replacement and use it; never leave
  the deprecated call in place or work around it.
- A scaffold or "latest" install — verify the commands and defaults first.

Skip it for refactoring working code, general TypeScript or algorithm logic,
and this repo's own rules — `SPEC.md`, `docs/features/` and the layer skills
are the source for those, not external docs.

## The two calls

1. **`resolve-library-id`** — `libraryName` is the official name (`Next.js`,
   `Sanity`, `Drizzle ORM`); `query` is the task. Read the installed major from
   the consuming workspace's `package.json` — or, when the entry reads
   `catalog:`, from the root `pnpm-workspace.yaml` `catalog:` block — and pick
   the result whose versions include it, using its `/org/project/version` ID.
2. **`query-docs`** — that `libraryId`, `language: 'TypeScript'`, and a
   `query` scoped to one concept (`"typegen configuration in sanity.cli.ts"`,
   `"defineArrayMember image fields"`, `"structureTool singleton"`). Two
   concepts are two calls.

Each tool allows three calls per question; after that, use the best result.
Apply what came back, and query again only when the task moves to a different
API area. The code you write follows the fetched docs, not training-data
recollection.

## Libraries worth checking here

| Library                                        | Look up                                                         |
| ---------------------------------------------- | --------------------------------------------------------------- |
| `sanity`                                       | `define*` options, `structureTool`, Studio config               |
| `@sanity/cli`                                  | `schema extract`, `typegen generate`, `migrations` flags        |
| `@sanity/code-input`                           | Plugin registration, `code` array member                        |
| `groqd`                                        | Builder methods, `InferResultType`/`InferFragmentType`          |
| `next-sanity`                                  | `createClient`, `client.fetch` options                          |
| `sanity-image`                                 | `SanityImage` props                                             |
| `next`                                         | App Router conventions, `generateMetadata`, caching/revalidate  |
| `next-auth` (v5 beta), `@auth/drizzle-adapter` | Config shape, callbacks, adapter tables                         |
| `drizzle-orm`, `drizzle-kit`                   | Query builder, schema API, `generate`/`migrate`                 |
| `@base-ui/react`                               | Component parts, props, data attributes                         |
| `tailwindcss`, `tailwind-variants`             | v4 directives and theme, `tv()` slots/variants                  |
| `next-intl`                                    | Message formatting, ICU syntax, request config                  |
| `vitest`, `@testing-library/*`                 | Config keys, `mergeConfig`, `vi.mock`, queries, `userEvent` v14 |
| `turbo`                                        | Task keys, `dependsOn`, `outputs`, env                          |
