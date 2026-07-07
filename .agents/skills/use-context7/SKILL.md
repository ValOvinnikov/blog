---
name: use-context7
description: >-
  How and when to pull live library documentation via the context7 MCP server.
  Use before implementing anything that depends on a specific library version,
  CLI flag, configuration format, or API shape — especially for packages that
  evolve quickly (Sanity v4, Next.js 15, Tailwind v4, Vitest). Apply whenever
  you are about to guess at an API rather than verify it.
---

# Use context7 for live documentation

Training data goes stale. The context7 MCP server fetches current, version-matched
docs for any library so you implement against the real API, not a cached
approximation. Treat it like a mandatory read before writing non-trivial
integration code.

## When to use it

Use context7 whenever you would otherwise be guessing:

- A CLI command or flag you are not certain of
  (`sanity schema extract`, `sanity typegen generate` options, `pnpm` workspace
  flags, Turbo task config keys).
- A configuration file format that changes between major versions
  (`sanity.cli.ts` typegen block, `next.config.ts` options, Tailwind v4
  `@import`/`@source` directives, Vitest config shape).
- A library API whose call signature, generic constraints, or import path may
  have shifted (`defineType`/`defineField`/`defineArrayMember` in Sanity v4,
  `defineQuery` in `next-sanity`, `client.fetch` options).
- A deprecation notice you hit mid-task — look up the replacement immediately
  rather than working around the old API.
- Any "latest" install: verify the scaffold commands and default choices before
  running them.

## When NOT to use it

Skip context7 for:

- Refactoring existing, already-working code.
- General programming logic (algorithms, data transformation, TypeScript
  narrowing patterns).
- Business rules that live in `SPEC.md` / `IMPLEMENTATION_BRIEF.md` — those are
  the canonical source, not external docs.

## The two-step pattern

1. **Resolve** — call context7 with the library name to get its versioned library
   ID. Be specific: `"sanity v4"` is better than `"sanity"`.

2. **Fetch** — call context7 with the resolved ID and a focused topic string
   (e.g. `"typegen configuration sanity.cli.ts"`, `"defineArrayMember image
fields"`, `"structureTool singleton desk structure"`). Narrow the topic so the
   returned snippet is actionable, not a wall of text.

Apply what you learn immediately; do not re-read unless the task shifts to a
different API area.

## Key libraries for this repo

| Library                  | Use context7 when…                                                                     |
| ------------------------ | -------------------------------------------------------------------------------------- |
| `sanity` v4              | `defineType`/`defineField` options, desk structure, typegen workflow, `schema extract` |
| `@sanity/code-input`     | Plugin registration, `code` array member usage                                         |
| `next-sanity`            | `defineQuery`, `createClient`, `useLiveMode`, `SanityImage`                            |
| `next` v15               | `generateMetadata`, `generateStaticParams`, App Router conventions, `revalidatePath`   |
| `tailwindcss` v4         | `@import`/`@source` directives, preset/plugin API, config format changes               |
| `vitest`                 | Config keys, `mergeConfig`, environment options                                        |
| `@testing-library/react` | Query priority, async utilities, `userEvent` v14 API                                   |
| `@sanity/cli`            | `sanity schema extract` flags, `sanity deploy` options                                 |
| `turbo`                  | `turbo.json` task keys, `dependsOn`, `outputs`                                         |

## Integration with other skills

- In `develop-feature` step 1 (Investigate): if a library version is central to
  the plan, resolve + fetch docs before writing the plan.
- In `add-content-type` steps 1–2: fetch Sanity `defineType` and typegen docs if
  you hit an unexpected type error or deprecation.
- In `testing-practices`: fetch Vitest or Testing Library docs when config or
  query API feels uncertain.
- In `seo-and-metadata`: fetch Next.js `generateMetadata` docs for any new
  metadata field or JSON-LD shape.

## Checklist

- [ ] Resolved the correct versioned library ID before fetching.
- [ ] Topic string was specific enough to return actionable content.
- [ ] Implementation matches the fetched docs, not training-data assumptions.
- [ ] No deprecated API left in place when the docs showed a replacement.
