---
name: cms-schema-practices
description: >-
  Best practices for Sanity schema types and content migrations in apps/cms.
  Use when adding or restructuring schema types, writing validation, building
  desk structure, or authoring a migration. Complements the cms agent and the
  add-content-type skill — this is the quality bar for how CMS code is
  written, not just what it models.
---

# CMS schema & migration practices

The schema layer is the source of truth for every downstream type, so
sloppiness here multiplies through `service`/`ui`/`web`. These rules exist
because each one was violated in a real PR and cost review time.

## Schema definition quality

### DRY — extract repeated field patterns (rule of three, applied at two)

If the same field shape appears **twice**, extract a factory helper; never
copy-paste it a third time. The canonical offender: a "mode + custom value"
pair (radio source selector + hidden custom field + conditional
`rule.custom()` validation) repeated four times in one module, ~40 lines each.
Write it once:

```ts
// schema-types/helpers/define-mode-field-pair.ts
type TModeFieldPair = {
  name: string; // 'heroTitle' → mode field is `${name}Mode`
  title: string;
  modeOptions: { title: string; value: string }[];
  customType?: 'string' | 'text';
};

export const defineModeFieldPair = ({
  name,
  title,
  modeOptions,
  customType = 'string',
}: TModeFieldPair) => [
  defineField({
    name: `${name}Mode`,
    title: `${title} Source`,
    type: 'string',
    options: { layout: 'radio', list: modeOptions },
    validation: (rule) => rule.required(),
  }),
  defineField({
    name,
    title: `Custom ${title}`,
    type: customType,
    hidden: ({ parent }) => !isMode(parent, `${name}Mode`, MODE.CUSTOM),
    validation: (rule) =>
      rule.custom((value, context) =>
        isMode(context.parent, `${name}Mode`, MODE.CUSTOM) && !value
          ? `Custom ${title.toLowerCase()} is required when ${title} Source is Custom.`
          : true,
      ),
  }),
];
```

Shared helpers live in `apps/cms/src/schema-types/helpers/` — schema-only
utilities, never exported to other packages.

### No magic strings — every stored value is a constant

A string that is **stored in a document** or **matched against in code**
(`options.list` values, mode discriminators, `_type` names referenced in
`initialValue`/migrations/queries) must come from a single constant. New
enum-ish values follow the UPPERCASE key/value rule in `@blog/config`
(`constants/`); `_type` names get a const object too (values stay the real
type names):

```ts
// @blog/config constants/module.ts
export const MODULE_TYPE = {
  HERO: 'module_hero',
  POST_LIST: 'module_postList',
  CONTENT: 'module_content',
  CTA: 'module_cta',
} as const;
```

The test: if renaming a stored value requires edits in more than one file
(schema + initialValue + migration + service), it should have been a
constant. **Legacy lowercase stored values** (`'postCategory'`, `'custom'`)
can't be silently uppercased — that's a data migration; centralize them
as-is and flag the rename as follow-up work.

### Validation parity — restructures never silently drop constraints

When fields move into an object or array (e.g. flat fields → `modules[]`),
the constraints must move with them or be consciously re-decided:

- A previously `required()` capability needs a container-level rule — e.g.
  `modules` gets `rule.custom()` enforcing "exactly one `module_hero`" or at
  least `min(1)`, if the page cannot render without it.
- Cardinality that the old shape guaranteed implicitly (one hero, one post
  list) must be enforced explicitly once an array makes duplicates possible —
  otherwise downstream code that picks `.find(...)` silently ignores editor
  input.
- If you decide a constraint should genuinely be dropped, say so in your
  report — a dropped validation is a contract change for `service`
  (`.notNull()` decisions), never a side effect.

### Naming & prose stay truthful after a move

- Renaming/moving a type means updating helper type names, descriptions, and
  preview text. A generic `module_hero` must not keep a `THomePageParent`
  helper type or a "Post featured in the **Home** hero" description.
- Follow `{group}_{name}` for new types; each type in its own file; register
  in the group index.
- **Schema defs are named exports** — `export const {localName}Schema =
defineType(...)` (`heroSchema`, `postSchema`, `siteSchema`), never
  `export default defineType`. Registration indexes and cross-references
  import the named symbol (`to: [{ type: heroSchema.name }]`), so a rename is
  compiler-checked instead of a stringly-typed hunt.

### Previews

- Every document and object type gets a `preview` (icon + meaningful
  title/subtitle) — editors navigate by these.
- Type the `prepare` input instead of scattering `as` casts where practical
  (`prepare({ title }: { title?: string })`).

## Migration quality

- **Idempotency via target-state guard, symmetric across all document types.**
  Skip when the _target_ shape is already present (`modules !== undefined`),
  not when the _source_ field is absent — a doc with both old and new shapes
  must not be re-wrapped or clobbered. Every `documentTypes` branch uses the
  same guard style.
- **One source of truth for moved fields.** The field list exists once (a
  `const ... as const` array); the legacy type, the module builder, and the
  `unset()` list all derive from it. Four hand-maintained parallel lists is
  how fields get orphaned.
- **Every migration ships a co-located test** (`*.test.ts`): the transform on
  a representative fixture, and a re-run on already-migrated input proving
  it's a no-op (idempotency). See `testing-practices`.
- **Header comment = operator manual:** what it transforms, the
  export → dry → inspect → human-gated run workflow, and the deploy-ordering
  constraint (migrate production **before** deploying code that expects the
  new shape).
- Stored values written by the migration come from the same `@blog/config`
  constants the schema uses.

## Definition of done additions

Beyond the cms agent's checklist:

- No copy-pasted field pattern that a helper should own.
- No stored-value literal repeated across files.
- Restructure PRs state explicitly which constraints moved, were added, or
  were dropped — and why.
- Migration has its test and both guards.
