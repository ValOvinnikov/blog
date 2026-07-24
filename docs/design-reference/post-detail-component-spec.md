# Post Detail page atomic component implementation instructions

Status: deferred. This file is retained as design reference only and must not be
pulled into the Home page rollout. The Home-only plan lives in
`docs/home-page-rollout.md`.

Source design: Console direction A — azure serif. This file assumes the Home page component library has already been implemented. Reuse shared components from the Home page implementation instead of duplicating them.

This file follows the same structure as the provided reference instruction file, but all conditional styling uses `tailwind-variants` instead of `cn()`.

## 0. Global assumptions before implementation

Read these first:

1. `shared-foundations-and-rules.md`
2. `home-page-component-spec.md`

Use the same Tailwind tokens as the Home page.

Important implementation rules:

- Use `tv()` from `tailwind-variants` for component variants and conditional classes.
- Do not use `cn()`.
- Reuse Home components wherever listed below.
- Post content uses a narrow reading measure, not the full Home page width.
- Metadata wraps on narrow screens.
- Code blocks scroll horizontally instead of breaking layout.
- Optional cover image is removed completely when missing.

Responsive baseline:

- Mobile first.
- Post page container uses `max-w-post`.
- Article body uses `max-w-measure`.
- Optional cover image keeps `16 / 9` aspect ratio.
- Long code lines use horizontal scrolling inside the code block.

---

## 1. Existing shared components from Home page

Import and reuse these components. Do not rebuild them inside the Post Detail page implementation.

| Component                          | Path                                             | Reuse in Post Detail                                |
| ---------------------------------- | ------------------------------------------------ | --------------------------------------------------- |
| `Logo`                             | `src/components/atoms/Logo.tsx`                  | Used by `SiteHeader`.                               |
| `NavLink`                          | `src/components/atoms/NavLink.tsx`               | Used by `PrimaryNavigation`.                        |
| `IconButton` / `ThemeToggleButton` | `src/components/atoms/IconButton.tsx`            | Used by `PrimaryNavigation`.                        |
| `Eyebrow`                          | `src/components/atoms/Eyebrow.tsx`               | Used by `ArticleHeader` for category.               |
| `Heading`                          | `src/components/atoms/Heading.tsx`               | Use `post` variant. Add it if not already included. |
| `Text`                             | `src/components/atoms/Text.tsx`                  | Reuse for lead/body text where practical.           |
| `MetaSeparator`                    | `src/components/atoms/MetaSeparator.tsx`         | Used by `PostMeta`.                                 |
| `MediaFrame`                       | `src/components/atoms/MediaFrame.tsx`            | Used by `ImageWithCaption`.                         |
| `PrimaryNavigation`                | `src/components/molecules/PrimaryNavigation.tsx` | Used by `SiteHeader`.                               |
| `SiteHeader`                       | `src/components/molecules/SiteHeader.tsx`        | Used by `PostPageTemplate`.                         |

If `Heading` currently only supports `hero` and `card`, extend it with this variant rather than creating a new `PostTitle` component:

```txt
post: text-post-title tracking-tight-display
```

Post title placement belongs in `ArticleHeader`:

```txt
mt-3 max-w-[18ch]
```

---

## 2. New or extended atoms for Post Detail

### 2.1 `ProseLink`

Path: `src/components/atoms/ProseLink.tsx`

Purpose: Inline links inside article body copy.

Tailwind classes:

```txt
text-accent underline decoration-border-strong underline-offset-2 transition-colors duration-base ease-console hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
```

Responsive behaviour:

- No breakpoint-specific styling.
- Must inherit surrounding font size.
- Do not force block display.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv } from 'tailwind-variants';

const proseLinkStyles = tv({
  base: [
    'text-accent underline decoration-border-strong underline-offset-2',
    'transition-colors duration-base ease-console hover:text-accent-hover',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  ],
});

export function ProseLink({
  className,
  ...props
}: React.ComponentProps<typeof Link>) {
  return <Link className={proseLinkStyles({ class: className })} {...props} />;
}
```

---

### 2.2 `InlineCode`

Path: `src/components/atoms/InlineCode.tsx`

Purpose: Inline code token inside prose.

Tailwind classes:

```txt
rounded-sm bg-surface-2 px-[5px] py-px font-mono text-[0.9em] text-text
```

Responsive behaviour:

- No breakpoint-specific styling.
- Keep it inline.
- Avoid `whitespace-nowrap`; inline code can wrap if the word is long enough to require wrapping.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const inlineCodeStyles = tv({
  base: 'rounded-sm bg-surface-2 px-[5px] py-px font-mono text-[0.9em] text-text',
});

export function InlineCode({
  className,
  ...props
}: React.ComponentProps<'code'>) {
  return <code className={inlineCodeStyles({ class: className })} {...props} />;
}
```

---

### 2.3 `Tag`

Path: `src/components/atoms/Tag.tsx`

Purpose: Post tag pill at the end of the article.

Base classes:

```txt
inline-flex items-center rounded-sm border border-border px-2 py-[3px] font-mono text-label uppercase tracking-[0.06em] text-subtle
```

Active/tinted classes:

```txt
border-transparent bg-accent-muted text-accent
```

Responsive behaviour:

- Tags wrap inside `TagList`.
- Do not set margins on the atom.
- Do not force horizontal scrolling.

Implementation shape:

```tsx
import { tv, type VariantProps } from 'tailwind-variants';

const tagStyles = tv({
  base: 'inline-flex items-center rounded-sm border border-border px-2 py-[3px] font-mono text-label uppercase tracking-[0.06em] text-subtle',
  variants: {
    active: {
      true: 'border-transparent bg-accent-muted text-accent',
    },
  },
});

type TagProps = React.ComponentProps<'span'> & VariantProps<typeof tagStyles>;

export function Tag({ active, className, ...props }: TagProps) {
  return (
    <span className={tagStyles({ active, class: className })} {...props} />
  );
}
```

---

### 2.4 `Caption`

Path: `src/components/atoms/Caption.tsx`

Purpose: Figure captions below optional post cover images.

Tailwind classes:

```txt
mt-2 font-mono text-label leading-[1.5] text-subtle
```

Responsive behaviour:

- No breakpoint-specific styling.
- Caption should be hidden with the figure if there is no image.
- Keep caption concise; long captions can wrap naturally.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const captionStyles = tv({
  base: 'mt-2 font-mono text-label leading-[1.5] text-subtle',
});

export function Caption({
  className,
  ...props
}: React.ComponentProps<'figcaption'>) {
  return (
    <figcaption className={captionStyles({ class: className })} {...props} />
  );
}
```

---

## 3. New molecules for Post Detail

### 3.1 `PostMeta`

Path: `src/components/molecules/PostMeta.tsx`

Purpose: Article metadata line.

Uses:

- `MetaSeparator` from Home implementation

Tailwind classes:

```txt
root: my-4 flex flex-wrap items-center gap-y-1 border-y border-border py-[9px] font-mono text-meta text-subtle
categoryLink: text-accent no-underline transition-colors duration-base ease-console hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
```

Responsive behaviour:

- Metadata wraps on small screens.
- Separators can stay visible; wrapping is acceptable because each item is short.
- Do not use `overflow-hidden` because dates/categories should remain readable.

Implementation shape:

```tsx
import Link from 'next/link';
import { tv } from 'tailwind-variants';

const postMetaStyles = tv({
  slots: {
    root: 'my-4 flex flex-wrap items-center gap-y-1 border-y border-border py-[9px] font-mono text-meta text-subtle',
    categoryLink:
      'text-accent no-underline transition-colors duration-base ease-console hover:text-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
  },
});

export function PostMeta({
  dateIso,
  dateLabel,
  readingTime,
  wordCount,
  category,
  categoryHref,
}: PostMetaProps) {
  const { root, categoryLink } = postMetaStyles();

  return (
    <div className={root()}>
      <time dateTime={dateIso}>{dateLabel}</time>
      <MetaSeparator />
      <span>{readingTime}</span>
      <MetaSeparator />
      <span>{wordCount}</span>
      <MetaSeparator />
      <Link href={categoryHref} className={categoryLink()}>
        {category.toUpperCase()}
      </Link>
    </div>
  );
}
```

---

### 3.2 `CodeBlock`

Path: `src/components/molecules/CodeBlock.tsx`

> **Implementation note:** despite the path above, `CodeBlock` deliberately
> lives in `apps/web` at
> `apps/web/src/components/shared/portable-text-renderer/code-block.tsx`, not
> as a `@blog/ui` molecule. It wraps `react-syntax-highlighter`, a
> third-party rendering dependency that `@blog/ui` must stay free of per this
> repo's layer contracts (`@blog/ui` is pure/prop-driven with no
> fetch/Sanity/third-party-rendering deps). The styling and behaviour
> described below still apply; only the package location differs from what's
> shown here.

Purpose: Code sample block in article body.

Tailwind classes:

```txt
root: my-[18px] overflow-hidden rounded-md border border-border bg-surface-2
header: flex items-center justify-between gap-3 border-b border-border px-3 py-[7px] font-mono text-label text-subtle
copyButton: text-subtle transition-colors duration-base ease-console hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg
pre: m-0 overflow-x-auto px-3.5 py-3 font-mono text-code text-text
commentToken: text-subtle
accentToken: text-accent
```

Responsive behaviour:

- `pre` must use `overflow-x-auto`.
- Do not wrap long code lines.
- Keep font size stable across breakpoints.
- The block must not overflow the viewport at 375px.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const codeBlockStyles = tv({
  slots: {
    root: 'my-[18px] overflow-hidden rounded-md border border-border bg-surface-2',
    header:
      'flex items-center justify-between gap-3 border-b border-border px-3 py-[7px] font-mono text-label text-subtle',
    copyButton:
      'text-subtle transition-colors duration-base ease-console hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    pre: 'm-0 overflow-x-auto px-3.5 py-3 font-mono text-code text-text',
  },
});

export function CodeBlock({ filename, children }: CodeBlockProps) {
  const { root, header, copyButton, pre } = codeBlockStyles();

  return (
    <div className={root()}>
      <div className={header()}>
        <span>{filename}</span>
        <button type="button" className={copyButton()}>
          copy
        </button>
      </div>
      <pre className={pre()}>
        <code>{children}</code>
      </pre>
    </div>
  );
}
```

---

### 3.3 `QuoteBlock`

Path: `src/components/molecules/QuoteBlock.tsx`

Purpose: Article pull quote / blockquote.

Tailwind classes:

```txt
my-[18px] border-l-2 border-accent-muted py-0.5 pl-4 font-read text-lead italic text-muted
```

Responsive behaviour:

- No breakpoint-specific styling.
- Keep quote inside `ArticleBody` max width.
- Do not add extra horizontal margins that would shrink mobile width further.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const quoteBlockStyles = tv({
  base: 'my-[18px] border-l-2 border-accent-muted py-0.5 pl-4 font-read text-lead italic text-muted',
});

export function QuoteBlock({
  className,
  ...props
}: React.ComponentProps<'blockquote'>) {
  return (
    <blockquote className={quoteBlockStyles({ class: className })} {...props} />
  );
}
```

---

### 3.4 `TagList`

Path: `src/components/molecules/TagList.tsx`

Purpose: List of post tags.

Uses:

- `Tag`

Tailwind classes:

```txt
root: mt-5 flex flex-wrap gap-2
```

Responsive behaviour:

- Tags wrap across lines.
- Do not scroll horizontally.
- Do not render if tags array is empty.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const tagListStyles = tv({
  base: 'mt-5 flex flex-wrap gap-2',
});

export function TagList({ tags }: TagListProps) {
  if (!tags.length) return null;

  return (
    <div className={tagListStyles()} aria-label="Post tags">
      {tags.map((tag) => (
        <Tag key={tag.slug} active={tag.active}>
          {tag.label}
        </Tag>
      ))}
    </div>
  );
}
```

---

### 3.5 `ImageWithCaption`

Path: `src/components/molecules/ImageWithCaption.tsx`

Purpose: Optional post cover image with caption.

Uses:

- `MediaFrame` from Home implementation
- `Caption`

Tailwind classes:

```txt
figure: my-[18px] mb-5
media: aspect-[16/9] min-h-[180px] md:min-h-[210px]
```

Responsive behaviour:

- Remove the whole component when `image` is missing.
- Keep `16 / 9` on all breakpoints.
- Use `sizes="(min-width: 768px) 47.5rem, 100vw"` for the post cover.
- Caption renders only when caption text exists.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const imageWithCaptionStyles = tv({
  slots: {
    figure: 'my-[18px] mb-5',
    media: 'aspect-[16/9] min-h-[180px] md:min-h-[210px]',
  },
});

export function ImageWithCaption({ image, caption }: ImageWithCaptionProps) {
  if (!image) return null;

  const { figure, media } = imageWithCaptionStyles();

  return (
    <figure className={figure()}>
      <MediaFrame
        src={image.src}
        alt={image.alt}
        sizes="(min-width: 768px) 47.5rem, 100vw"
        className={media()}
        priority
      />
      {caption ? <Caption>{caption}</Caption> : null}
    </figure>
  );
}
```

---

## 4. Organisms used by Post Detail

### 4.1 `ArticleHeader`

Path: `src/components/organisms/ArticleHeader.tsx`

Purpose: Article heading area with category, title, metadata, lead, and optional cover image.

Uses:

- `Eyebrow` from Home implementation
- `Heading` with `post` variant
- `PostMeta`
- `Text`
- `ImageWithCaption`

Tailwind classes:

```txt
root: pt-6
title: mt-3 max-w-[18ch]
lead: m-0 max-w-measure
```

Responsive behaviour:

- Title scales using `text-post-title` and stays narrow with `max-w-[18ch]`.
- Metadata wraps.
- Cover image appears below lead text and keeps `16 / 9`.
- If cover image is missing, `ImageWithCaption` returns `null`; no vertical media gap is reserved.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const articleHeaderStyles = tv({
  slots: {
    root: 'pt-6',
    title: 'mt-3 max-w-[18ch]',
    lead: 'm-0 max-w-measure',
  },
});

export function ArticleHeader({
  category,
  title,
  lead,
  meta,
  coverImage,
  coverCaption,
}: ArticleHeaderProps) {
  const { root, title: titleStyle, lead: leadStyle } = articleHeaderStyles();

  return (
    <header className={root()}>
      <Eyebrow>{category}</Eyebrow>
      <Heading as="h1" level="post" className={titleStyle()}>
        {title}
      </Heading>
      <PostMeta {...meta} />
      <Text variant="lead" className={leadStyle()}>
        {lead}
      </Text>
      <ImageWithCaption image={coverImage} caption={coverCaption} />
    </header>
  );
}
```

---

### 4.2 `ArticleBody`

Path: `src/components/organisms/ArticleBody.tsx`

Purpose: Wrapper for article content modules. If using MDX, map MDX elements to the atoms/molecules above.

Tailwind classes:

```txt
root: max-w-measure
paragraph: m-0 mt-[14px] first:mt-0 font-read text-lead text-text
```

Spacing rule:

```txt
Use module margins, not wrapper `space-y`, because CodeBlock and QuoteBlock already include `my-[18px]`.
For simple paragraphs after paragraphs, apply `mt-[14px]` to the second and later paragraph.
```

Responsive behaviour:

- Body stays within `68ch`.
- Code blocks scroll horizontally inside the measure.
- Tags wrap.
- Do not use full viewport width for prose.

Suggested MDX component mapping:

```tsx
const mdxComponents = {
  p: (props) => (
    <p
      className="m-0 mt-[14px] first:mt-0 font-read text-lead text-text"
      {...props}
    />
  ),
  a: ProseLink,
  code: InlineCode,
  pre: CodeBlock,
  blockquote: QuoteBlock,
};
```

Implementation shape without MDX:

```tsx
import { tv } from 'tailwind-variants';

const articleBodyStyles = tv({
  slots: {
    root: 'max-w-measure',
    paragraph: 'm-0 mt-[14px] first:mt-0 font-read text-lead text-text',
  },
});

export function ArticleBody({ children, tags }: ArticleBodyProps) {
  const { root } = articleBodyStyles();

  return (
    <div className={root()}>
      {children}
      <TagList tags={tags} />
    </div>
  );
}
```

---

## 5. Post page template

Path: `src/components/templates/PostPageTemplate.tsx`

Uses:

- `SiteHeader` from Home implementation
- `ArticleHeader`
- `ArticleBody`

Tailwind classes:

```txt
shell: min-h-screen bg-bg text-text font-read
container: mx-auto max-w-post px-gutter py-page-y
```

Responsive behaviour:

- Container is narrower than the Home page container to preserve reading measure.
- Header wraps as defined in Home `SiteHeader`.
- Article title uses `text-post-title` and max-width.
- Code blocks use horizontal scroll.
- Cover image keeps aspect ratio and disappears completely when missing.

Implementation shape:

```tsx
import { tv } from 'tailwind-variants';

const postPageTemplateStyles = tv({
  slots: {
    shell: 'min-h-screen bg-bg text-text font-read',
    container: 'mx-auto max-w-post px-gutter py-page-y',
  },
});

export function PostPageTemplate({ post }: PostPageTemplateProps) {
  const { shell, container } = postPageTemplateStyles();

  return (
    <div className={shell()}>
      <div className={container()}>
        <SiteHeader />
        <main>
          <article>
            <ArticleHeader
              category={post.category}
              title={post.title}
              lead={post.lead}
              meta={post.meta}
              coverImage={post.coverImage}
              coverCaption={post.coverCaption}
            />
            <ArticleBody tags={post.tags}>{post.content}</ArticleBody>
          </article>
        </main>
      </div>
    </div>
  );
}
```

---

## 6. Post Detail data shape suggestion

Use this data shape or adapt it to the existing CMS/data layer:

```ts
export type PostDetailData = {
  slug: string;
  category: string;
  title: string;
  lead: string;
  meta: {
    dateIso: string;
    dateLabel: string;
    readingTime: string;
    wordCount: string;
    category: string;
    categoryHref: string;
  };
  coverImage?: {
    src: string;
    alt: string;
  };
  coverCaption?: string;
  content: React.ReactNode;
  tags: Array<{
    slug: string;
    label: string;
    active?: boolean;
  }>;
};
```

---

## 7. Post Detail build order for an AI agent

1. Import existing shared components from the Home implementation.
2. Confirm `Heading` has the `post` variant. Add it if missing.
3. Implement post-only atoms: `ProseLink`, `InlineCode`, `Tag`, `Caption`.
4. Reuse `MediaFrame` from Home. Do not create a duplicate image-frame component.
5. Implement post-only molecules: `PostMeta`, `CodeBlock`, `QuoteBlock`, `TagList`, `ImageWithCaption`.
6. Implement organisms: `ArticleHeader`, `ArticleBody`.
7. Implement `PostPageTemplate`.
8. Add or update `src/app/writing/[slug]/page.tsx` so it fetches a post and renders `PostPageTemplate`.
9. Verify light and dark modes.
10. Verify post with cover image and post without cover image.
11. Verify long title, long metadata, long tag list, and long code line.
12. Verify responsive widths: `375px`, `768px`, `1024px`, `1280px`.

---

## 8. Acceptance checklist

- No `cn()` helper is used.
- All variant styling uses `tv()` from `tailwind-variants`.
- `SiteHeader` is imported from the Home implementation, not rebuilt.
- `Logo`, `NavLink`, `IconButton`, `Eyebrow`, `MetaSeparator`, and `MediaFrame` are reused.
- `Heading` is extended with `post`; no duplicate `PostTitle` component is created.
- Optional cover image renders only when image data exists.
- Missing cover image does not leave a blank frame or empty margin.
- Post content stays within the reading measure.
- Code blocks do not overflow the viewport.
- Metadata wraps without being clipped.
- Tags wrap and do not horizontally scroll.
- All links and buttons have visible focus states.
