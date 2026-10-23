---
title: Studio authoring
status: built
layers: [studio, config]
code:
  - packages/studio/src/studio-structure.ts
  - packages/studio/src/structure/build-section/**
  - packages/studio/src/structure/sections/**
  - packages/studio/src/schema-types/index.ts
  - packages/studio/src/schema-types/preview/**
  - packages/studio/src/schema-types/icons/**
  - packages/studio/src/schema-types/fields/title-field/**
  - packages/studio/src/schema-types/fields/slug-field/**
  - packages/studio/src/schema-types/fields/image-alt-field/**
  - packages/studio/src/schema-types/fields/localized-field-options/**
  - packages/studio/src/schema-types/fields/localized-one-line-text-field/**
  - packages/studio/src/schema-types/fields/localized-multiline-text-field/**
  - packages/studio/src/schema-types/objects/image-with-alt/**
  - packages/studio/src/schema-types/inputs/slug-url-preview/**
  - packages/studio/src/schema-types/inputs/enabled-state-boolean-input.tsx
  - packages/studio/src/schema-types/validation/get-drafts-client/**
  - packages/studio/src/schema-types/validation/localized-string-values/**
  - packages/studio/src/schema-types/validation/validate-localized-max-length/**
  - packages/studio/src/schema-types/validation/validate-image-alt-filled/**
  - packages/studio/src/schema-types/validation/validate-image-has-asset/**
  - packages/studio/src/testing/**
  - packages/studio/scripts/typegen.mjs
  - packages/studio/sanity.cli.ts
epics: [4035, 2803, 3252, 1036, 4970, 2918]
---

# Studio authoring

## What it does

This is how content is modelled and edited in the Sanity Studio: the desk an editor navigates, the shared field kit every schema type is built from, the previews that label documents in lists, and the validation that blocks a publish. One schema in `@blog/studio` serves every tenant; the Studio is mounted per tenant by ./embedded-studio.md. The schema is also the source of every content type the rest of the monorepo reads, through generated types in `@blog/config`.

## Surfaces and routes

- **Desk ("Content"):** People (opens the Person list directly); Modules (Heroes, then one group per module kind: Explainers, Proof, Conversion, Posts); Blocks (Cards: feature and testimonial; FAQs; Links); Taxonomy (Topic, Tag); Pages (Home; Landing as a page tree; Blog: post index, posts, topic index, topics, tag index, tags); Templates (one per page type except posts); a divider; Settings (Navigation and Footer singletons, Redirects, then Site Settings).
- **Other tools:** Vision (GROQ), Media (`sanity-plugin-media`, the asset source for every image and file field).
- **Where it runs:** `/dashboard/studio` and `/tenants/{id}/studio` in the platform, or standalone with `pnpm --filter @blog/studio dev`.

## Data

- `schemaTypes` = documents + objects + Portable Text types (./rich-text.md) + modules (./module-system.md). Each type is a named `{localName}Schema` export.
- Desk list modes (`buildSections`): `list` (a plain document list), `singleton` (document id = type name), `byLanguage` (one list per live language plus "All pages", each creating in its language), `onePerLanguage` (opens the language's one document; the default language's id is the type name), `pageTree` (an orderable parent/child tree, ./landing-tree.md). With one live language, per-language sub-lists collapse to a single list.
- Generated types: `pnpm typegen` runs `scripts/typegen.mjs` (`sanity schema extract`, then `sanity typegen generate` per `sanity.cli.ts`) into `packages/config/src/sanity/generated/{schema.json,types.ts}`. Every other layer types content from there.
- The Studio reads and writes the tenant's own dataset from the browser; nothing here caches. Publishing fires the tenant's revalidation webhook (./rendering-and-caching.md).

## Configuration

- Editors (the tenant project's Sanity members) edit content; what they may do is decided by Sanity roles, not the platform.
- The desk's language lists follow the tenant's live languages (./languages.md). A module type whose capability is off stays in the desk and insert menus with a warning (./plans-and-entitlements.md).
- Look and Voice do not reach the Studio. Its UI is Sanity's own, in English.
- Changing the desk, a field or a validation rule is a code change in `@blog/studio`, shipped to every tenant at once.

## Constraints and invariants

- Every desk entry's schema has a `title` and an `icon`; `buildSections` throws otherwise. A section with `flattenSingleItem` must hold exactly one non-singleton item.
- Every type and editor-visible field carries a `description` written for an editor: what to put there and when, never the widget's mechanics, an enum identifier, or a restatement of a validation limit.
- Every document type and desk entry has an icon and a `preview` with a meaningful title (`buildSections` enforces the title and icon); object types often have neither. `prepare` inputs are typed. Shared helpers: `languagePreview` (title plus the language's label) and `moduleSubtitle` (brand variant and details joined with " · ").
- A shape repeated across schemas is a factory: `titleField` (internal, required), `slugField` (sourced from `title`, max 96, optional preview input and uniqueness check), `imageAltField` with `imageHotspotOptions`, `imageWithAlt`, and the localized fields (`localizedOneLineTextField`, `localizedMultilineTextField`, and the Portable Text ones in ./rich-text.md) backed by `internationalizedArray*` types.
- Stored option values come from UPPERCASE constants in `@blog/config`; `_type` names are referenced through the schema's `.name` (or its `*-type.ts` const where an import would cycle). An `options.list` states its `layout`, except `containerWidthField`, which leaves the default.
- A new field on an existing type gets no `required()` unless a backfill migration ships with it; a change to an existing shape needs a content migration (./cross-tenant-migrations.md).
- A cross-document validator reads through `getDraftsClient` and `fetchDraftsFailSafe`, which resolves a failed fetch to a fallback rather than blocking publish; the redirect validators use the published-perspective `getPublishedClient` with their own fallback on a failed fetch. `validateImageHasAsset` checks the asset reference itself, since `required()` on an image passes with only alt text or crop data; `validateImageAltFilled` requires alt only once an asset exists; `validateLocalizedMaxLength` applies a limit to every language.
- `createSlugUrlPreviewInput(prefix)` shows the public path under a slug field. `EnabledStateBooleanInput` labels a switch "Enabled"/"Disabled" instead of repeating the field title.
- The generated files are never hand-edited (deny-listed for edits); a wrong type means a wrong schema. Typegen can be non-deterministic, so it is re-run until the diff is minimal, and CI's `typegen` job fails on stale output.
- Schema definitions get no unit tests; validators, structure helpers, inputs, previews and migrations do. `src/testing/` holds the shared fakes, named `mock<Thing>` / `MOCK_<THING>` (`mockLandingPage`, `mockGroqValidationContext`, `mockFetchContext`, `mockStructureNode`, …), and the helpers `getRecordedValidators`, `getField` and `assertSatisfiesRequiredFields`.

## Dependencies

- Layers: `@blog/studio` (upstream `@blog/config`, `@blog/utils`); it feeds `@blog/config`'s generated types, which `@blog/service` and `apps/web` consume. Plugins: structure, vision, code input, media, document internationalization, internationalized arrays; `@sanity/orderable-document-list` renders the page tree.
- Features: ./embedded-studio.md, ./languages.md, ./module-system.md, ./page-types.md, ./landing-tree.md, ./links.md, ./rich-text.md, ./navigation.md, ./footer-and-legal-pages.md, ./people.md, ./topics-and-tags.md, ./cross-tenant-migrations.md, ./plans-and-entitlements.md.
- Env: `SANITY_STUDIO_PROJECT_ID` and `SANITY_STUDIO_DATASET` for the CLI (dev, typegen, migrations); none when mounted.

## Entry points

- `packages/studio/src/studio-config.ts`, `packages/studio/src/studio-structure.ts`
- `packages/studio/src/structure/build-section/build-section.ts`, `packages/studio/src/structure/sections/index.ts`
- `packages/studio/src/schema-types/index.ts`
- `packages/studio/src/schema-types/fields/title-field/title-field.ts`, `slug-field/slug-field.ts`, `image-alt-field/image-alt-field.ts`
- `packages/studio/src/schema-types/validation/get-drafts-client/get-drafts-client.ts`
- `packages/studio/scripts/typegen.mjs`, `packages/studio/sanity.cli.ts`
- `.claude/skills/studio-schema-practices/SKILL.md` (the authoring rules in full)

## Tests and stories

- `packages/studio/src/structure/build-section/build-section.test.ts`, `structure/module-kinds/module-kinds.test.ts`, `structure/page-tree/page-tree.test.ts`.
- `packages/studio/src/schema-types/preview/**/*.test.ts`, `inputs/slug-url-preview/slug-url-preview-path.test.ts`, `validation/**/*.test.ts`.
- `packages/studio/src/testing/*.test.ts`; `studio-config.test.ts` for plugin and template wiring.
- No Storybook in `@blog/studio`.

## Related

- #4035 localize the Studio interface for editors.
- #2803 module presets via initial-value templates.
- #3252 visual icon picker for `block_feature.icon`.
- #1036 draft preview with Draft Mode and Sanity Presentation.
- #4970 starter documents carry a visible Sample badge.
- #2918 cover `requireSchemaField`'s missing title and icon branches.
