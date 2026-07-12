# Choose-Your-Depth Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Repo-specific override:** this repo's CLAUDE.md delegation model applies —
> Tasks 1–2 belong to the `cms` agent, Task 3 + 8 to `service`, Tasks 4–5 to
> `ui`, Tasks 6–7 + 9 to `web`. **Every commit step below is human-gated:
> ask the user before each `git commit`. Never push or open a PR without a
> separate explicit approval.**

**Goal:** Every post renders at three reader-selectable depths — 30s skim / standard read / deep dive — with a persistent toggle, inline authored asides, and a publish-time AI pipeline that drafts the skim for human approval.

**Architecture:** Additive-only content model (inline `aside` blocks in the post body + a post-level `skim` field), all three depths shipped in one static page and switched client-side, and a draft-only generation route where `@blog/service` owns every Sanity read/write and `apps/web` owns the Anthropic call.

**Tech Stack:** Sanity Studio v6, groqd, Next.js 16 App Router, React 19, Tailwind v4 + tailwind-variants, Vitest + Testing Library, `@anthropic-ai/sdk` (route only), zod.

**Spec:** `docs/superpowers/specs/2026-07-12-reading-depth-design.md` — read it first; its decisions are binding.

## Global Constraints

- Layer contracts (SPEC.md §4): `ui → config` only, no `'use client'` in `@blog/ui`; only `@blog/service` imports Sanity SDKs (⇒ the draft patch lives in service, NOT in the web route); `apps/web` is the only place ui and service meet.
- Constants: `DEPTH` and `ASIDE_KIND` are UPPERCASE key/value `as const` in `@blog/config` (`constants/`); no stored-value literal may appear anywhere else (`cms-schema-practices`).
- Schema change is **additive/optional-only ⇒ no content migration** — state this explicitly in the PR description.
- All new env vars are optional in env schemas (absence = pipeline disabled, site unaffected) and must be declared in `turbo.json` `env` (turbo strict mode strips undeclared vars).
- After the cms task: `pnpm typegen` once, commit regenerated `packages/config/src/sanity/generated/*` (re-run until the diff is minimal — typegen is non-deterministic).
- Tests: seeded faker (`faker.seed(123)`), co-located, per `testing-practices`. UI components need a Storybook story (part of done).
- Spec-sync (blocking review rule): SPEC.md §6 content model + §1 surfaces must be updated in the same PR (Task 9).
- **Prerequisite:** the post detail route `/blog/[slug]` (#76/#90) must exist before Task 7 can be executed. Tasks 1–6 and 8 have no dependency on it.

## File Structure (all created/modified files)

```
packages/config/src/constants/depth.ts                 [create] DEPTH, ASIDE_KIND + types
packages/config/src/constants/index.ts                 [modify] re-export
apps/cms/src/schema-types/objects/aside.ts             [create] aside object type
apps/cms/src/schema-types/objects/skim.ts              [create] skim object type
apps/cms/src/schema-types/objects/index.ts             [modify] register both
apps/cms/src/schema-types/objects/portable-text.ts     [modify] add aside member
apps/cms/src/schema-types/documents/blog/post.ts       [modify] add skim field
packages/config/src/sanity/generated/{schema.json,types.ts}  [regenerated]
packages/service/src/shared/fragments/post.ts          [modify] project skim
packages/service/src/features/pages/post/adaptor/detail/types.ts        [modify] view-model
packages/service/src/features/pages/post/adaptor/detail/transformer.ts  [modify] skim + hasAsides
packages/service/src/features/pages/post/adaptor/detail/loader.test.ts  [modify] fixtures/tests
packages/service/src/features/editorial/skim/…         [create] saveSkimDraft feature (adaptor+application+index)
packages/service/src/index.ts                          [modify] editorial domain + exports
packages/ui/src/atoms/segmented-control/…              [create] atom + variants + test + story
packages/ui/src/molecules/aside/…                      [create] molecule + variants + test + story
packages/ui/src/index.ts                               [modify] barrel exports
apps/web/src/components/depth-provider/…               [create] client context + localStorage
apps/web/src/components/depth-toggle/…                 [create] client leaf composing SegmentedControl
apps/web/src/components/skim-panel/…                   [create] server component
apps/web/src/components/portable-text-renderer/…       [modify] aside mapping (exists after #76/#90)
apps/web/src/app/api/generate-skim/route.ts            [create] pipeline route
apps/web/src/server/skim/generate-takeaways.ts         [create] Anthropic call behind an interface
apps/web/src/utils/env/env.ts                          [modify] ANTHROPIC_API_KEY, SANITY_GENERATE_SECRET
packages/service/src/utils/env/env.ts                  [modify] SANITY_API_WRITE_TOKEN (optional)
turbo.json                                             [modify] declare new env vars
SPEC.md                                                [modify] §1 surfaces note + §6 content model
```

---

### Task 1: `@blog/config` — depth constants

**Files:**

- Create: `packages/config/src/constants/depth.ts`
- Modify: `packages/config/src/constants/index.ts`

**Interfaces:**

- Produces: `DEPTH` / `TDepth`, `ASIDE_KIND` / `TAsideKind` — imported by every later task. `ASIDE_TYPE = 'aside'` is the schema `_type` name used by cms, service, and the renderer.

- [ ] **Step 1: Write `depth.ts`** (mirror `link.ts` in the same folder):

```ts
export const DEPTH = {
  SKIM: 'SKIM',
  READ: 'READ',
  DEEP: 'DEEP',
} as const;

export type TDepth = (typeof DEPTH)[keyof typeof DEPTH];

export const ASIDE_KIND = {
  WHY_NOT: 'WHY_NOT',
  DIGRESSION: 'DIGRESSION',
  CONTEXT: 'CONTEXT',
} as const;

export type TAsideKind = (typeof ASIDE_KIND)[keyof typeof ASIDE_KIND];

// The Sanity `_type` of the inline aside block — single source of truth for
// schema registration, groqd matching, and the renderer mapping.
export const ASIDE_TYPE = 'aside' as const;
```

- [ ] **Step 2: Re-export** — append to `packages/config/src/constants/index.ts`:

```ts
export * from './depth';
```

- [ ] **Step 3: Verify** — Run: `pnpm --filter @blog/config type-check && pnpm --filter @blog/config lint`. Expected: both pass.
- [ ] **Step 4: Commit (ask user first)** — `git add packages/config/src/constants && git commit -m "feat(config): DEPTH, ASIDE_KIND, ASIDE_TYPE constants for reading depth"`

---

### Task 2: `cms` — aside object, skim field, typegen (agent: cms)

**Files:**

- Create: `apps/cms/src/schema-types/objects/aside.ts`, `apps/cms/src/schema-types/objects/skim.ts`
- Modify: `apps/cms/src/schema-types/objects/index.ts`, `apps/cms/src/schema-types/objects/portable-text.ts`, `apps/cms/src/schema-types/documents/blog/post.ts`

**Interfaces:**

- Consumes: `ASIDE_KIND`, `ASIDE_TYPE` from `@blog/config` (Task 1).
- Produces: generated types `Aside` and `Skim` in `packages/config/src/sanity/generated/types.ts`; `post.skim` optional; `aside` allowed inside `portableText`. **Additive only — no migration (report this).**

- [ ] **Step 1: `aside.ts`** — labels derived from the constant keys, no literal duplication:

```ts
import { ASIDE_KIND, ASIDE_TYPE } from '@blog/config';
import { MessageSquareQuote } from 'lucide-react';
import { defineField, defineType } from 'sanity';

const KIND_TITLES: Record<keyof typeof ASIDE_KIND, string> = {
  WHY_NOT: 'Why not X',
  DIGRESSION: 'Digression',
  CONTEXT: 'Context',
};

export default defineType({
  name: ASIDE_TYPE,
  title: 'Aside (deep dive)',
  type: 'object',
  icon: MessageSquareQuote,
  fields: [
    defineField({
      name: 'kind',
      title: 'Kind',
      type: 'string',
      options: {
        layout: 'radio',
        list: Object.entries(ASIDE_KIND).map(([key, value]) => ({
          title: KIND_TITLES[key as keyof typeof ASIDE_KIND],
          value,
        })),
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'blockText',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: { kind: 'kind', block: 'body.0.children.0.text' },
    prepare({ kind, block }: { kind?: string; block?: string }) {
      return {
        title: kind ? KIND_TITLES[kind as keyof typeof ASIDE_KIND] : 'Aside',
        subtitle: block,
      };
    },
  },
});
```

- [ ] **Step 2: `skim.ts`** — generated-then-approved takeaways:

```ts
import { Zap } from 'lucide-react';
import { defineField, defineType } from 'sanity';

export default defineType({
  name: 'skim',
  title: 'Skim (30s layer)',
  type: 'object',
  icon: Zap,
  fields: [
    defineField({
      name: 'takeaways',
      title: 'Takeaways',
      type: 'array',
      of: [{ type: 'string', validation: (rule) => rule.max(160) }],
      validation: (rule) => rule.min(3).max(7),
    }),
    defineField({
      name: 'generatedAt',
      title: 'Generated at',
      type: 'datetime',
      readOnly: true,
    }),
    defineField({
      name: 'model',
      title: 'Model',
      type: 'string',
      readOnly: true,
    }),
  ],
  preview: {
    select: { first: 'takeaways.0' },
    prepare({ first }: { first?: string }) {
      return { title: 'Skim', subtitle: first };
    },
  },
});
```

- [ ] **Step 3: Register + wire** — in `objects/index.ts` import both and append `aside, skim` to the `objects` array. In `portable-text.ts` add `defineArrayMember({ type: 'aside' })` — **but** import `ASIDE_TYPE` and use `defineArrayMember({ type: ASIDE_TYPE })`. In `documents/blog/post.ts` add after the `body` field:

```ts
defineField({
  name: 'skim',
  title: 'Skim (30s layer)',
  type: 'skim',
  description:
    'Auto-drafted on publish; edit and approve here. Optional — without it the post has no 30s mode.',
}),
```

- [ ] **Step 4: Verify Studio compiles** — Run: `pnpm --filter cms type-check && pnpm --filter cms lint`. Expected: pass.
- [ ] **Step 5: Typegen** — Run: `pnpm --filter cms typegen`, confirm `Aside`/`Skim` appear in `packages/config/src/sanity/generated/types.ts` and `Post` gains `skim?`. Re-run if unrelated types churn. Then `pnpm type-check` from root.
- [ ] **Step 6: Commit (ask user first)** — `git add apps/cms packages/config/src/sanity/generated && git commit -m "feat(cms): aside block + skim field for reading depth (additive, no migration)"`

---

### Task 3: `@blog/service` — project skim, compute hasAsides (agent: service)

**Files:**

- Modify: `packages/service/src/shared/fragments/post.ts` (postDetailFragment: add skim), `.../post/adaptor/detail/types.ts`, `.../detail/transformer.ts`
- Test: `.../post/adaptor/detail/loader.test.ts`

**Interfaces:**

- Consumes: generated `Aside` type (Task 2), `ASIDE_TYPE` from `@blog/config`.
- Produces: `TPostDetail.skim: string[] | undefined` and `TPostDetail.hasAsides: boolean` — Task 7 renders from these and must NOT scan the body itself.

- [ ] **Step 1: Extend the failing test first** — in `loader.test.ts`, extend the existing raw-post fixture with `skim: { takeaways: ['a', 'b', 'c'] }` and a body containing one aside block (`{ _type: 'aside', _key: 'a1', kind: 'WHY_NOT', body: [...] }` — reuse the fixture's block helper; import `ASIDE_KIND`, `ASIDE_TYPE` from `@blog/config` instead of literals). Assert:

```ts
expect(result.skim).toEqual(['a', 'b', 'c']);
expect(result.hasAsides).toBe(true);
```

Add a second case: fixture without `skim` and without asides → `skim` is `undefined`, `hasAsides` is `false`.

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @blog/service test -- post`. Expected: FAIL (unknown fields).
- [ ] **Step 3: Fragment** — in `shared/fragments/post.ts`, add to `postDetailFragment`'s projection (plain optional — skim is not schema-required):

```ts
skim: sub.field('skim.takeaways[]'),
```

- [ ] **Step 4: View-model + transformer** — `types.ts`:

```ts
export type TPostDetail = Omit<TPostCard, 'author' | 'categories'> & {
  body: PortableText;
  skim: string[] | undefined;
  hasAsides: boolean;
  seo: TSeoMeta | undefined;
  author: TPostDetailAuthor | undefined;
  categories: TCategory[];
};
```

`transformer.ts` (inside `toPostDetail`, after `body`; import `ASIDE_TYPE` from `@blog/config`):

```ts
skim: raw.skim && raw.skim.length >= 3 ? raw.skim : undefined,
hasAsides: raw.body.some((block) => block._type === ASIDE_TYPE),
```

(`skim` under 3 items is treated as absent — mirrors the schema `min(3)`; no faked defaults, `undefined` not `null`.)

- [ ] **Step 5: Run tests** — `pnpm --filter @blog/service test && pnpm --filter @blog/service type-check && pnpm --filter @blog/service lint`. Expected: PASS.
- [ ] **Step 6: Commit (ask user first)** — `git commit -m "feat(service): skim + hasAsides on TPostDetail"`

---

### Task 4: `@blog/ui` — SegmentedControl atom (agent: ui)

**Files:**

- Create: `packages/ui/src/atoms/segmented-control/segmented-control.tsx`, `segmented-control-variants.ts`, `segmented-control.test.tsx`, `segmented-control.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**

- Consumes: nothing new.
- Produces: `SegmentedControl` with props `TSegmentedControlProps = { options: { value: string; label: string }[]; value: string; onChange?: (value: string) => void; ariaLabel: string; className?: string; dataTestId?: string }`. Pure and handler-via-prop (same pattern as the existing `ThemeToggle` atom — no `'use client'` here; the web leaf owns state). Rendered as a `radiogroup` of buttons.

- [ ] **Step 1: Failing test** (`faker.seed(123)`; RTL by role):

```tsx
it('renders one radio per option and reports selection', async () => {
  const onChange = vi.fn();
  render(
    <SegmentedControl
      ariaLabel="Reading depth"
      options={[
        { value: 'SKIM', label: '30s' },
        { value: 'READ', label: 'Read' },
      ]}
      value="READ"
      onChange={onChange}
    />,
  );
  expect(
    screen.getByRole('radiogroup', { name: 'Reading depth' }),
  ).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: 'Read' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await userEvent.click(screen.getByRole('radio', { name: '30s' }));
  expect(onChange).toHaveBeenCalledWith('SKIM');
});
```

- [ ] **Step 2: Run to verify failure** — `pnpm --filter @blog/ui test -- segmented-control`. Expected: FAIL.
- [ ] **Step 3: Implement** — arrow function, `tv()` variants co-located, `base` as concern-grouped array, token utilities only (`bg-bg`, `text-muted`, `text-accent`, `border-border`), selected state via `aria-checked` + variant. Buttons are `type="button"`, `role="radio"`, wrapped in `role="radiogroup"` with `aria-label={ariaLabel}` (ariaLabel is a required prop — no hardcoded labels, per the accessibility rules). Forward `className` through the `tv()` `class:` key; spread `...rest`.
- [ ] **Step 4: Story** — per `ui-storybook`: default + two-option + disabled-free (no disabled state in V1 — YAGNI); controls for `value`.
- [ ] **Step 5: Verify** — `pnpm --filter @blog/ui test && pnpm --filter @blog/ui type-check && pnpm --filter @blog/ui lint`. Expected: PASS. Export from `src/index.ts`.
- [ ] **Step 6: Commit (ask user first)** — `git commit -m "feat(ui): SegmentedControl atom"`

---

### Task 5: `@blog/ui` — Aside molecule (agent: ui)

**Files:**

- Create: `packages/ui/src/molecules/aside/aside.tsx`, `aside-variants.ts`, `aside.test.tsx`, `aside.stories.tsx`
- Modify: `packages/ui/src/index.ts`

**Interfaces:**

- Consumes: `TAsideKind`, `ASIDE_KIND` from `@blog/config` (type only for the prop union).
- Produces: `Aside` with props `TAsideProps = { kind: TAsideKind; kindLabel: string; children: ReactNode; className?: string; dataTestId?: string }`. `kindLabel` is passed by web (i18n-ready — ui never hardcodes copy). Renders `<aside>` with the label as an eyebrow and `children` as content; `kind` selects the accent variant via `tv()`.

- [ ] **Step 1: Failing test:**

```tsx
it('renders the kind label and content in an aside landmark', () => {
  render(
    <Aside kind={ASIDE_KIND.WHY_NOT} kindLabel="Why not X">
      <p>Because Y.</p>
    </Aside>,
  );
  expect(screen.getByRole('complementary')).toBeInTheDocument();
  expect(screen.getByText('Why not X')).toBeInTheDocument();
  expect(screen.getByText('Because Y.')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to verify failure**, **Step 3: Implement** (semantic `<aside>`, kind variant matrix in `aside-variants.ts`, tokens only), **Step 4: Story** (one story per kind), **Step 5: Verify** — same commands as Task 4. Expected: PASS.
- [ ] **Step 6: Commit (ask user first)** — `git commit -m "feat(ui): Aside molecule for deep-dive blocks"`

---

### Task 6: `web` — depth state: provider, no-flash script, toggle leaf (agent: web)

**Files:**

- Create: `apps/web/src/components/depth-provider/depth-provider.tsx` (+ test), `apps/web/src/components/depth-toggle/depth-toggle.tsx` (+ test), `apps/web/src/config/depth-script.ts`
- Modify: the post page wrapper once Task 7 lands (provider is self-contained here)

**Interfaces:**

- Consumes: `DEPTH`, `TDepth` from `@blog/config`; `SegmentedControl` from `@blog/ui` (Task 4).
- Produces: `DepthProvider` (client context: `{ depth: TDepth; setDepth: (d: TDepth) => void }`, exported hook `useDepth()`), `DepthToggle` (client leaf; props `{ hasSkim: boolean; hasDeep: boolean; labels: { skim: string; read: string; deep: string; ariaLabel: string } }` — labels come from next-intl at the call site). Persistence key: `'reading-depth'` in `localStorage`; provider mirrors state to `data-depth` on its wrapper `<div>` so pure CSS (`[data-depth='DEEP'] …`) can gate asides without re-render churn.

- [ ] **Step 1: Failing tests** — provider: renders children, defaults to `DEPTH.READ`, `setDepth` persists to `localStorage` and updates `data-depth`; restores a stored `'DEEP'` on mount; ignores garbage stored values (falls back to READ). Toggle: hides the SKIM option when `hasSkim` is false, hides DEEP when `hasDeep` is false, renders nothing when both are false.
- [ ] **Step 2: Run to verify failure** — `pnpm --filter web test -- depth`. Expected: FAIL.
- [ ] **Step 3: Implement** — follow `theme-toggle-button.tsx` exactly for the mount/localStorage/try-catch pattern (`'use client'`, `useState` + `useEffect`, guarded `localStorage.setItem`). `depth-script.ts` mirrors `theme-script.ts`: a tiny inline pre-hydration snippet that reads `localStorage['reading-depth']` and sets `data-depth` on the provider target to avoid a flash for returning DEEP readers. Validate stored values against `Object.values(DEPTH)`.
- [ ] **Step 4: Run tests** — Expected: PASS. `pnpm --filter web type-check && pnpm --filter web lint`.
- [ ] **Step 5: Commit (ask user first)** — `git commit -m "feat(web): reading-depth state (provider, toggle leaf, no-flash script)"`

---

### Task 7: `web` — render the three depths on the post page (agent: web)

**⚠ Prerequisite: the `/blog/[slug]` route + `PortableTextRenderer` from #76/#90 must exist.** If they don't, stop and report — do not scaffold the post page inside this task.

**Files:**

- Create: `apps/web/src/components/skim-panel/skim-panel.tsx` (+ test), `apps/web/src/components/deep-aside/deep-aside.tsx` (+ test)
- Modify: `apps/web/src/components/portable-text-renderer/…` (add the `aside` type mapping), the post page (`src/app/[locale]/blog/[slug]/page.tsx`) to wrap the article in `DepthProvider` and place `DepthToggle` + `SkimPanel`

**Interfaces:**

- Consumes: `TPostDetail.skim` / `.hasAsides` (Task 3), `Aside` molecule (Task 5), `useDepth` (Task 6), `ASIDE_TYPE`, `ASIDE_KIND`.
- Produces: the complete reader feature. Kind labels come from the i18n messages file (`ASIDE_KIND` → translated label map built in web — one place).

- [ ] **Step 1: Failing tests** — renderer test: portable text containing an aside renders it inside an element that is hidden unless the wrapper has `data-depth="DEEP"` (assert the gating class/attribute, not pixels). SkimPanel test: renders one `<li>` per takeaway; renders nothing when `skim` is undefined; the "read the full article" button calls `setDepth(DEPTH.READ)`. Page-level test: toggle receives `hasSkim`/`hasDeep` from the view-model.
- [ ] **Step 2: Run to verify failure.**
- [ ] **Step 3: Implement** — `DeepAside` (server-safe wrapper): renders the `Aside` molecule inside a `<div>` gated by CSS: hidden by default, visible under `[data-depth='DEEP']` (classes in a co-located variants file — no inline Tailwind strings). Renderer map: `{ [ASIDE_TYPE]: DeepAside }` added to the existing component mappings; aside `body` (blockText) renders through the existing block components. `SkimPanel`: server component fed `skim` + a client "switch to READ" leaf; gated visible only under `[data-depth='SKIM']`; the article body gets the inverse gate (hidden under SKIM). Body markup for all three depths is always in the HTML — CSS/state switching only, no conditional fetch.
- [ ] **Step 4: Depth availability** — page passes `hasSkim={Boolean(post.skim)}` and `hasDeep={post.hasAsides}` to `DepthToggle`. **The `frontend-design` skill drives the visual treatment of the toggle, panel, and asides in this step.**
- [ ] **Step 5: Verify** — `pnpm --filter web test && pnpm --filter web type-check && pnpm --filter web lint && pnpm build` (root). Expected: PASS/green build.
- [ ] **Step 6: Commit (ask user first)** — `git commit -m "feat(web): three-depth post rendering (skim panel, deep asides, toggle)"`

---

### Task 8: pipeline — service write feature + generate-skim route (agents: service, then web)

**Files:**

- Create: `packages/service/src/features/editorial/skim/adaptor/save-skim-draft.ts` (+ test), `.../editorial/skim/application/service.ts` (+ test), `.../editorial/skim/index.ts`
- Create: `apps/web/src/server/skim/generate-takeaways.ts` (+ test), `apps/web/src/app/api/generate-skim/route.ts` (+ test)
- Modify: `packages/service/src/utils/env/env.ts` (add optional `SANITY_API_WRITE_TOKEN`), `packages/service/src/sanity/client.ts` (write client factory, only when token present), `packages/service/src/index.ts` (editorial domain), `apps/web/src/utils/env/env.ts` (optional `ANTHROPIC_API_KEY`, `SANITY_GENERATE_SECRET`), `turbo.json` (declare all three in `build.env`), `apps/web/package.json` (add `@anthropic-ai/sdk`, `zod` already present)

**Interfaces:**

- Consumes: `TPostDetail`-adjacent read (post body by id via existing detail loader is fine — the route receives the Sanity document id from the webhook payload).
- Produces: `service.editorial.skim.v1.saveSkimDraft({ postId, takeaways, model }): Promise<void>` — patches `drafts.${postId}` only, creating the draft from the published doc if none exists (`client.transaction()` with `createIfNotExists` on the draft id, then `patch().set({ skim: { takeaways, generatedAt, model } })`). `generateTakeaways(body: PortableText): Promise<string[]>` — Claude `claude-haiku-4-5`, response forced through `zod` schema `z.array(z.string().max(160)).min(3).max(7)`; throws on parse failure.

- [ ] **Step 1 (service): failing test** — mock the write client; assert `saveSkimDraft` targets the `drafts.` id, never the published id; assert it throws (for `safeAsync` upstream) when the token/env is absent.
- [ ] **Step 2 (service): implement + verify** — env: `SANITY_API_WRITE_TOKEN: z.string().min(1).optional()`. Write client mirrors the read client construction with the write token and `useCdn: false`. Feature follows the standard `adaptor/application/index` shape with `safeAsync` in `application/service.ts`. Run `pnpm --filter @blog/service test type-check lint`. Commit (ask): `feat(service): editorial.skim.v1.saveSkimDraft`.
- [ ] **Step 3 (web): failing route tests** — `POST /api/generate-skim`: 401 on missing/wrong `?secret=`; 503 when `ANTHROPIC_API_KEY` or the service write path is unconfigured; happy path: given `{ _id }` body, calls read → `generateTakeaways` → `saveSkimDraft`, returns `{ ok: true, count }`; Claude returning malformed JSON → 422, draft untouched (assert `saveSkimDraft` not called). Mock `@anthropic-ai/sdk` and the service.
- [ ] **Step 4 (web): implement** — `generate-takeaways.ts` isolates the Anthropic client (single exported function; prompt asks for 3–7 takeaways, ≤160 chars, JSON array only; temperature 0). Route handler stays thin: verify secret (timing-safe compare, same as the revalidate route), parse webhook body with zod (`{ _id: z.string() }`), orchestrate, map failures to 4xx/5xx, always `console.error` details server-side only.
- [ ] **Step 5: env plumbing** — web `env.ts`: both vars optional; `turbo.json` `build.env`: append `ANTHROPIC_API_KEY`, `SANITY_GENERATE_SECRET`, `SANITY_API_WRITE_TOKEN`. Run root `pnpm build` with none of them set → must stay green (feature-flag-by-absence).
- [ ] **Step 6: verify + commit (ask user first)** — full root gates. `git commit -m "feat(web): generate-skim pipeline route (draft-only, human-approved)"`

---

### Task 9: docs, spec-sync, and operator setup (agent: web/orchestrator)

**Files:**

- Modify: `SPEC.md` (§1 surface table note for depth modes; §6 add `aside` + `skim` to the content model; §7 env table: three new optional vars)
- Modify: `docs/BACKLOG.md` — mark M3.3 as "spec'd + planned", link this plan

**Steps:**

- [ ] **Step 1:** SPEC edits per above (spec-sync is a blocking review rule — same PR).
- [ ] **Step 2:** Write the operator runbook into the PR description: Sanity webhook creation (manage.sanity.io → API → webhooks: filter `_type == "post"` on publish → `POST https://<site>/api/generate-skim?secret=…`), the two tokens to mint (scoped Editor robot token for writes; keep Viewer token as-is), Vercel env var entry. These are human-gated console steps — the agent documents, the human clicks.
- [ ] **Step 3:** Full gates from root: `pnpm typegen && pnpm type-check && pnpm lint && pnpm test && pnpm build`. Expected: all green.
- [ ] **Step 4:** Run the `code-review-practices` skill over the full diff (contract pass + general pass) before asking to open the PR. Then the standard human-gated sequence: ask commit → ask push → ask PR (`feat: choose-your-depth reading (spec 2026-07-12)`, one concern, references backlog M3.3).

---

## Execution order & parallelism

Sequential spine: **1 → 2 → 3 → 7**. Tasks 4, 5 (ui) can run in parallel with 2–3 (no type dependency — props are self-owned). Task 6 needs only Task 1. Task 8 needs Tasks 1–3 but not 4–7. Task 7 is the only one blocked on external work (#76/#90 post route). If the post route is still pending when 1–6 + 8 are done, ship them as PR 1 (feature dormant, fully tested) and Task 7 + 9 as PR 2 after the route lands.
