---
name: studio-schema-practices
description: >-
  Best practices for Sanity schema types and content migrations in packages/studio.
  Use when adding or restructuring schema types, writing validation, building
  desk structure, or authoring a migration. Complements the studio agent and the
  add-content-type skill — this is the quality bar for how Studio code is
  written, not just what it models.
---

# Studio schema & migration practices

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
// schema-types/modules/hero/hero.ts — local to the one schema that uses it
type TModeFieldPair = {
  name: string; // 'heroTitle' → mode field is `${name}Mode`
  title: string;
  modeOptions: { title: string; value: string }[];
  customType?: 'string' | 'text';
};

const modeFieldPair = ({
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

Where a factory lives follows its reach: used by one schema → a local,
non-exported function in that schema file; wraps one object type → beside the
object (`objects/seo/seo-field.ts`); shared more widely →
`schema-types/fields/<name>/<name>.ts`. Validators with more than one caller
live in `schema-types/validation/<name>/<name>.ts`. All are schema-only
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
defineType(...)` (`heroSchema`, `postPageSchema`, `siteSettingsSchema`), never
  `export default defineType`. Registration indexes and cross-references
  import the named symbol (`to: [{ type: heroSchema.name }]`), so a rename is
  compiler-checked instead of a stringly-typed hunt.

### Previews

- Every document and object type gets a `preview` (icon + meaningful
  title/subtitle) — editors navigate by these.
- Type the `prepare` input instead of scattering `as` casts where practical
  (`prepare({ title }: { title?: string })`).

### Descriptions — every type, every field, written for an editor

**Every registered type and every field an editor can see carries a
`description`.** A type's says what the thing is **for**, in one sentence. A
field's says what it is for **and when to set it**. Both are read by
non-technical people inside the Studio, so they use the words an editor would
use for what appears on the page — never an internal `_type` value, an
uppercase enum identifier (`SPLIT`, `PRIMARY`), or a component name.

**Never restate validation.** No "required", no "max 60 characters", no "up to
two". The Studio already renders the required marker and the character
counter, so a prose copy is redundant the day it is written and wrong the day
the rule changes. Say what the field is for; let the widget state the rule.

The distinction that matters when you are tempted: describing a **constraint**
is out, describing a **consequence** is in. "Required — keep between 30 and 60
characters" is a constraint. "Aim for a full sentence or two so it reads well;
a single word displays poorly" is a consequence, survives a change to
`max()`, and is genuinely more useful. When a rule is real but unenforced,
express it qualitatively rather than reintroducing the number.

Two guards in `schema-types/index.test.ts` fail the build when a type or a
field ships without a description — one over the `schemaTypes` registry, one
over each registered type's own fields. **They check presence, not quality**;
nothing but review catches a description that is present and useless. The only
exemption is a type no editor ever opens (`migrationState`, the migration
tooling's own ledger), named explicitly in the guard's `NOT_EDITOR_FACING`
set — extend that set only for another genuinely hidden system type, never to
silence a real gap.

Where the same description would be pasted into more than one schema, it is a
shared constant like any other repeated literal (`PAGE_HEADING_DESCRIPTION`
beside `headingBlockField`), not copy-paste.

### Option lists — dropdown by default, radio when the field is required

`dropdown` is Sanity's default for a `list`; `layout: 'radio'` is an explicit
opt-out. The choice turns on one documented behaviour: **a dropdown always
renders a blank option for the unset state, and it cannot be removed or
renamed.** Neither `initialValue` nor `validation` suppresses it.

So the test is:

- **`required()` → radio.** The blank is a selectable trap that passes
  unnoticed in the form and only surfaces as an error at publish. Radio is the
  documented way to avoid it. A required field that also drives other fields'
  `hidden:` predicates is the strongest case of all — the editor flips it to
  reveal the rest of the form, and wants every option visible at once.
- **Not required → dropdown.** Blank is already a legal value, so the
  dropdown's blank costs nothing and buys a compact, scannable form. This
  holds whether or not the field has an `initialValue`: a default value does
  not make blank invalid.

Option count is not the test. A 4-option optional field is a dropdown and a
3-option required one is a radio; more options only reinforce a conclusion the
`required()` check has already reached.

**State the layout explicitly either way** rather than relying on the default,
so a reader can tell a decision was made from the code alone.

The `modeFieldPair` factory above keeps `layout: 'radio'` under this rule, not
in spite of it: its mode field is `required()` and gates a conditional custom
field.

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

Beyond the studio agent's checklist:

- No copy-pasted field pattern that a helper should own.
- No stored-value literal repeated across files.
- Every new type and field has a description, written for an editor, restating
  no validation.
- Every new `options.list` states its `layout`, chosen by the `required()`
  test — and a radio on a field that is not required is justified in the
  report, or changed.
- Restructure PRs state explicitly which constraints moved, were added, or
  were dropped — and why.
- Migration has its test and both guards.
