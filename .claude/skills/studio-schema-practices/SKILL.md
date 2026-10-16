---
name: studio-schema-practices
description: >-
  Use when adding or restructuring Sanity schema types in packages/studio,
  writing validation, descriptions or option lists, or authoring a content
  migration — the quality bar for how Studio code is written.
---

# Studio schema & migration practices

The schema is the source of truth for every downstream type, so a flaw here
multiplies through `service`, `ui` and `web`. Naming, file layout, the desk and
tests: `.claude/agents/studio.md`. The content model: `SPEC.md` §6.

## Schema definition quality

### DRY — one factory per repeated field shape

The change that would write a field shape a second time extracts a factory
instead (CLAUDE.md → "Reuse before you create"). Read `fields/` and `objects/`
first: a factory that fits except for its copy gains an optional `description`
override, never a clone. `ctaButtonsField` (`fields/cta-buttons-field/`) is the
model — the array, its limits and its one-action-per-variant check written
once, with `title`, `description`, `min` and `max` as overrides.

Where a factory lives follows its reach:

- used by one schema → a local, non-exported function in that schema file;
- wraps one object type → beside the object (`objects/seo/seo-field.ts`);
- shared more widely → `schema-types/fields/<name>/<name>.ts`.

A validator moves to `schema-types/validation/<name>/<name>.ts` once it has a
second caller or logic worth testing (a cross-document read, a cardinality or
cross-field check) — an inline `rule.custom` is never tested. All of these are
schema-only and never exported from the package.

### No magic strings — every stored value is a constant

A value **stored in a document** or **matched in code** — `options.list`
values, mode discriminators, values written by `initialValue` or a migration —
comes from one UPPERCASE key/value const in `@blog/config` `constants/`
(CLAUDE.md → Conventions), as `LINK_TYPE` does for `link`'s `linkType`. The
test: if renaming the value would touch more than one file, it should have been
a constant.

- **`_type` names are not `@blog/config` constants.** Inside the Studio,
  reference the schema's `.name` (`to: [{ type: linkSchema.name }]` in
  `objects/link-ref/link-ref.ts`), never a string, so a rename is
  compiler-checked. Where importing the schema would close an import cycle,
  import its sibling `<name>-type.ts` const instead (`PAGE_POST_TYPE` from
  `documents/pages/post/post-type.ts`) — don't "fix" those to `.name`.
  Downstream literals are checked against the generated types (`TModuleType`,
  groqd's `filterByType`); a migration uses the literal or a local const
  ("Migration quality").
- **A stored value that isn't uppercase can't be uppercased in place** — that
  is a data migration. Centralize it as-is and raise the rename separately.

### Validation parity — restructures never silently drop constraints

When fields move into an object or array, their constraints move with them or
are consciously re-decided:

- A capability that was `required()` needs a container-level rule (`min(1)` or
  a `rule.custom()`) if the page cannot render without it.
- Cardinality the old shape guaranteed implicitly is enforced explicitly once
  an array allows duplicates (`validate-pricing-single-highlighted-tier`) —
  otherwise a downstream `.find(...)` silently ignores editor input.
- A constraint dropped on purpose is named in your report: it is a contract
  change for `service`'s `.notNull()` decisions, never a side effect.
- **A new field on an existing document type gets no `required()`.**
  `initialValue` never backfills, so every stored document would turn invalid.
  Give it an `initialValue` and have `service` read it through `coalesce()`,
  or pair the `required()` with a backfill migration.

### Naming & prose stay truthful after a move

Moving or renaming a type updates its helper type names, descriptions and
preview text — a generic module must not keep a `THomePageParent` type or a
"Post featured in the **Home** hero" description. Naming, file layout and the
named `{localName}Schema` export: `.claude/agents/studio.md` → "Naming" and
"File layout".

### Previews

- Every document and object type gets a `preview` — icon plus a meaningful
  title/subtitle; editors navigate by them.
- Type the `prepare` input (`prepare({ title }: { title?: string })`) instead
  of scattering `as` casts.

### Descriptions — every type, every field, written for an editor

Every registered type and every editor-visible field carries a `description`.
A type's says what it is **for**, in one sentence. A field's says what to put
in it **and when to set it** — never how the widget behaves or what each
option means. Use the editor's words for what appears on the page — never a
`_type`, an enum identifier (`SPLIT`, `PRIMARY`) or a component name.

**Never restate validation** — no "required", "max 60 characters", "up to
two". The Studio renders the required marker and the counter, so prose is
redundant on day one and wrong once the rule changes. Describe a
**consequence**, not a **constraint**: "Aim for a sentence or two; a single
word displays poorly" survives a change to `max()`; "keep between 30 and 60
characters" does not. State a real but unenforced rule qualitatively.

Copy every caller would repeat lives on the factory as its default
(`ctaButtonsField`, `brandVariantField`). A caller overrides it only where the
default would be untrue for that field — never with the same words — so read
the default before writing one.

No test checks any of this — a test could only confirm a description exists,
not that it is true. The author and the reviewer own it.

### Option lists — `required()` is the guard, the layout is presentation

- **State `layout` on every `options.list`**, so the code shows a decision was
  made. Dropdown is the default. Radio is for when the editor benefits from
  seeing every option at once — in practice a field driving other fields'
  `hidden:` predicates, like `linkType` in `documents/link/link.ts`. Option
  count is not the test, though a list long enough to scroll argues against
  radio.
- **`required()` decides nothing about layout.** A dropdown's blank option
  can't be removed, but `required()` flags it inline and blocks publish, and a
  radio has an unset state too.
- **Put `required()` wherever blank is not a legal value** (subject to the
  new-field rule above). `variantField` (`fields/variant-field/`) is the model:
  `layout: 'dropdown'`, an `initialValue`, `rule.required()`.

### No toggle beside the field it switches on

When a boolean's only job is to switch an optional field on, drop the boolean —
a filled field is the switch. A pricing tier is highlighted when its
`highlightLabel` is filled; it has no `isHighlighted`. With both, the toggle can
be off while the label is filled, and the editor can't tell which wins. A view
that needs the boolean derives it from the field.

The switching field gets **no `initialValue`** — a default would switch it on
for every new item.

Keep a separate boolean only when it means something the field can't express,
such as a flag that changes behaviour while the field keeps its value.

## Migration quality

The export → dry-run → inspect → human-gated run workflow, and `lib/` for
helpers a second migration needs: `migrations/README.md`.

- **A migration that changes an existing shape ships in two releases —
  expand, then contract.** A release migrates content before the new web is
  deployed, and the web still live reads the old shape until that deploy
  lands, so removing or renaming a shape in the same release breaks the live
  site for that window and leaves no way back. **Expand** adds the new field or
  value, copies the data across and keeps the old shape, so the deployed web
  keeps working. **Contract** removes the old shape in a later release, once no
  code reads it. The expand ticket files its contract follow-up, labelled
  `prio:later`, when it is created. An additive, optional-only change needs no
  migration and no contract step.
- **Idempotency via a target-state guard, in the same style on every
  `documentTypes` branch.** Skip when the _target_ shape is present
  (`modules !== undefined`), not when the _source_ field is absent — a doc
  holding both shapes must not be re-wrapped or clobbered.
- **One source of truth for moved fields** — a `const … as const` list from
  which the legacy type, the builder and the `unset()` list all derive.
  Parallel hand-kept lists are how fields get orphaned.
- **Stored values come from the same `@blog/config` constants the schema
  uses**; `_type` names are the literal or a local const.
- **Never import a Studio schema module (`src/schema-types`), or anything that
  reaches bare `sanity` or React** — `sanity/migrate` is fine. Every
  migration's `index.ts` is loaded to build `sanity migrations list`, so one
  such import breaks every migration while type-check and vitest stay green.
  Redeclare a schema-module constant locally (the test imports the real one,
  so drift fails), and run `pnpm --filter @blog/studio migrate:list` before
  committing.
- **Every migration ships a co-located `*.test.ts`**: the transform on a
  representative fixture, and a re-run on migrated input proving it a no-op
  (`testing-practices` → "What to test").
- **No header comment** — what it transforms goes in the PR description.
- Both deploy workflows run `migrate` before `deploy-web`; a migration run by
  hand goes before the code that expects its shape.

## Definition of done additions

Beyond `.claude/agents/studio.md` → "Definition of done":

- No copy-pasted field shape that a factory should own.
- No stored-value literal repeated across files.
- Every new type and field has an editor-facing description that restates no
  validation.
- Every new `options.list` states its `layout`, and carries `required()`
  wherever blank is not a legal value — two independent decisions.
- No `required()` on a new field of an existing type without a backfill
  migration.
- Restructure PRs state which constraints moved, were added or were dropped,
  and why.
- Every migration has its test and a target-state guard on each branch, and
  `migrate:list` loads it.
