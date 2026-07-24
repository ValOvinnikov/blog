---
name: web-storybook
description: >-
  How to write, run, and maintain Storybook stories in apps/web. Covers RSC
  caveats, service-layer mocking, and page-composition story conventions.
  Use when adding stories for Next.js pages, layouts, or client components in
  apps/web. Complements ui-storybook (for pure design-system stories) and
  seo-and-metadata.
---

# Storybook in `apps/web`

Storybook v10 with `@storybook/nextjs-vite` (Vite-based — `@storybook/nextjs`'s
webpack preset requires `next/config`, which Next.js 16 removed entirely; see
[storybookjs/storybook#29421](https://github.com/storybookjs/storybook/issues/29421)).
Runs on port **6007**.

```
pnpm --filter web storybook        # dev server
pnpm --filter web storybook:build  # static build
```

RSC experimental mode is enabled (`features.experimentalRSC: true` in
`.storybook/main.ts`). `@storybook/nextjs-vite` handles Next.js Image, Link,
and navigation stubs automatically. `Meta`/`StoryObj`/`Preview` types come
from `@storybook/nextjs-vite` (the framework package), not `@storybook/react`
— Storybook 10 moved to framework-based type imports.

Storybook 10 folded `@storybook/addon-essentials` into core (viewport,
controls, interactions, actions ship for free — no addon needed). The one
piece that didn't move to core is docs: `@storybook/addon-docs` is an
explicit `addons` entry in `.storybook/main.ts`, required for the
`tags: ['autodocs']` convention below to work.

## What to story in `apps/web`

`apps/web` stories are for **compositions** — components that wire `@blog/ui`
to real page structure. Two categories:

| Type                                 | Examples                                 | Note                                 |
| ------------------------------------ | ---------------------------------------- | ------------------------------------ |
| **Client components**                | theme toggle, mobile nav, share buttons  | Straightforward; no RSC setup needed |
| **Server components / page layouts** | `PostPage`, `HomeLayout`, `CategoryPage` | Require service mocks (see below)    |

Pure design-system components belong in `@blog/ui` stories, not here. If you
find yourself storying a `Button` in `apps/web`, move it to `packages/ui`.

## Where stories live

Co-locate stories next to the component. The globs in `main.ts` cover:

```
src/app/**/*.stories.@(ts|tsx)
src/components/**/*.stories.@(ts|tsx)
```

Example:

```
src/app/[locale]/blog/[slug]/
  page.tsx
  page.stories.tsx   ← here
```

(Kebab-case files, `src/`-rooted paths — same conventions as the rest of
`apps/web`.)

## Story format (CSF 3)

```tsx
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PostPage } from './post-page';
import { mockPost } from '@web/storybook/fixtures/post';

const meta = {
  title: 'Pages/PostPage',
  component: PostPage,
  tags: ['autodocs'],
  args: { post: mockPost },
} satisfies Meta<typeof PostPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const LongBody: Story = {
  args: { post: { ...mockPost, body: mockPost.bodyLong } },
};
```

## Mocking `@blog/service`

Server Components in `apps/web` call service functions (`getPosts`,
`getPost`, etc.). Storybook does not run a real Sanity connection, so you
must mock the service layer.

### Approach A — Accept data as props (preferred)

Extract the data-fetching into the route `page.tsx` and accept data as props
in the component:

```tsx
// post-page.tsx (pure, accepts typed props)
export function PostPage({ post }: { post: TPostDetail }) { ... }

// src/app/[locale]/blog/[slug]/page.tsx (fetches + passes props)
export default async function Page({ params }: TProps) {
  const { slug } = await params;
  const result = await service.pages.post.v1.getPostBySlug(slug);
  if (!result.ok) notFound();
  return <PostPage post={result.data} />;
}
```

Now `PostPage.tsx` is a pure, easily-storied component.

### Approach B — Module mock for RSC

For async Server Components that fetch internally, use Storybook's module
mock. Create a mock file and register it:

```ts
// .storybook/mocks/service.ts
export const getPosts = async () => [mockPost];
export const getPost = async () => mockPost;
// ... etc.
```

```ts
// .storybook/main.ts — main.ts is loaded as ESM (no __dirname/require), so
// resolve the mock path via import.meta.url
import { fileURLToPath } from 'node:url';

const config: StorybookConfig = {
  // ...
  async viteFinal(viteConfig) {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...viteConfig.resolve.alias,
      '@blog/service': fileURLToPath(
        new URL('./mocks/service.ts', import.meta.url),
      ),
    };
    return viteConfig;
  },
};
```

Only add the alias when the story file needs it — prefer Approach A for
new components to avoid the coupling.

## RSC caveats

- `experimentalRSC: true` lets Storybook render `async` Server Components,
  but support is still experimental. Prefer Approach A (pure components) to
  avoid edge cases.
- `"use client"` components story identically to any React component — no
  special setup needed.
- Next.js navigation (`useRouter`, `usePathname`) is automatically stubbed
  by `@storybook/nextjs-vite`. Control it via `parameters.nextjs.navigation`.

```tsx
export const WithActiveNav: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: '/blog/my-post' },
    },
  },
};
```

## Fixtures

Two separate fixture locations — don't conflate them:

- `apps/web/src/storybook/fixtures/` — Storybook-only. Mocks the **service
  view-models** (`TPostDetail`, `THomePage`, … from `@blog/service`), the
  shapes pages actually receive, not raw Sanity documents. Never import these
  from a test file.

  ```ts
  // src/storybook/fixtures/post.ts
  import type { TPostDetail } from '@blog/service';
  export const mockPost: TPostDetail = {
    title: 'Hello World',
    slug: 'hello-world',
    // ...view-model fields, not raw Sanity document fields
  };
  ```

- `apps/web/src/testing/` — fixtures shared between a component's
  `.stories.tsx` **and** its `.test.tsx` (e.g. raw Portable Text / schema-shaped
  data a lower-level component renders directly, not a page-level
  view-model). Mirrors the component tree; see `testing-practices` → "Where
  tests live" for the convention and import path
  (`@web/testing/<component>/fixtures`).

If a story's data is also something a test needs, it belongs in
`src/testing/`, not `src/storybook/fixtures/`.

## Tailwind in apps/web stories

The `@storybook/nextjs-vite` framework picks up `next.config.ts` and, being
Vite-based, resolves CSS through Vite's built-in PostCSS pipeline — it
auto-detects `postcss.config.mjs` at the app root, so the existing
`@tailwindcss/postcss` plugin config keeps working unchanged. The global
stylesheet is `apps/web/index.css` (the one `src/app/[locale]/layout.tsx`
imports) — import it in `.storybook/preview.ts`:

```ts
import '../index.css';
```

This ensures `@import` of the shared theme and the `@source` directive for
`packages/ui` are active in Storybook.

## Naming convention

Use page-level paths: `"Pages/PostPage"`, `"Pages/HomePage"`,
`"Layouts/PageLayout"`, `"Components/MobileNav"`.

## Checklist before finishing

- [ ] Component accepts data as props (Approach A) rather than fetching
      internally, where possible.
- [ ] All required props provided via `args`; no live Sanity calls.
- [ ] `nextjs.navigation.pathname` set if component checks active route.
- [ ] Fixtures live in `src/storybook/fixtures/`; not imported outside Storybook.
- [ ] Story compiles clean — `.storybook` and `src/**/*.tsx` (including
      `.stories.tsx`) are covered by `apps/web/tsconfig.json`'s `include`, so
      `pnpm --filter web type-check` already catches TS errors here; no
      separate `storybook:build` needed. Verify the story renders correctly
      in the running dev server (`pnpm --filter web storybook`) — that's the
      check for actual Storybook/Vite runtime issues type-check can't see.
