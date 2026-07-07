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

Storybook v8 with `@storybook/nextjs`. Runs on port **6007**.

```
pnpm --filter web storybook        # dev server
pnpm --filter web storybook:build  # static build
```

RSC experimental mode is enabled (`features.experimentalRSC: true` in
`.storybook/main.ts`). `@storybook/nextjs` handles Next.js Image, Link, and
navigation stubs automatically.

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
app/**/*.stories.@(ts|tsx)
components/**/*.stories.@(ts|tsx)
```

Example:

```
app/blog/[slug]/
  page.tsx
  page.stories.tsx   ← here
```

## Story format (CSF 3)

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { PostPage } from './PostPage';
import { mockPost } from '@/storybook/fixtures/post';

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
// PostPage.tsx (pure, accepts typed props)
export function PostPage({ post }: { post: Post }) { ... }

// app/blog/[slug]/page.tsx (fetches + passes props)
export default async function Page({ params }) {
  const post = await getPost(params.slug);
  return <PostPage post={post} />;
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
// .storybook/main.ts viteFinal (if mocking is needed)
config.resolve = config.resolve ?? {};
config.resolve.alias = {
  ...config.resolve.alias,
  '@blog/service': path.resolve(__dirname, 'mocks/service.ts'),
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
  by `@storybook/nextjs`. Control it via `parameters.nextjs.navigation`.

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

Keep shared mock data in `apps/web/storybook/fixtures/`. These are not
production code — never import fixtures from outside Storybook.

```ts
// storybook/fixtures/post.ts
import type { Post } from '@blog/types';
export const mockPost: Post = {
  _id: 'mock-1',
  title: 'Hello World',
  slug: { current: 'hello-world' },
  // ...
};
```

## Tailwind in apps/web stories

The `@storybook/nextjs` framework picks up `next.config.ts` and processes
CSS through the Next.js PostCSS pipeline. If the global stylesheet is
`app/globals.css`, import it in `.storybook/preview.ts`:

```ts
import '../app/globals.css';
```

This ensures `@import "tailwindcss"` and the `@source` directive for
`packages/ui` are active in Storybook.

## Naming convention

Use page-level paths: `"Pages/PostPage"`, `"Pages/HomePage"`,
`"Layouts/PageLayout"`, `"Components/MobileNav"`.

## Checklist before finishing

- [ ] Component accepts data as props (Approach A) rather than fetching
      internally, where possible.
- [ ] All required props provided via `args`; no live Sanity calls.
- [ ] `nextjs.navigation.pathname` set if component checks active route.
- [ ] Fixtures live in `storybook/fixtures/`; not imported outside Storybook.
- [ ] `pnpm --filter web storybook:build` exits cleanly (no TS errors).
