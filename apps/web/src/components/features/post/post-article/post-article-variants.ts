import { tv } from 'tailwind-variants';

export const postArticleVariants = tv({
  slots: {
    hero: ['mx-auto w-full', 'max-w-page px-gutter'],
    // Hidden on SKIM — the inverse of `skimPanelVariants`' own gate.
    body: [
      'mx-auto w-full px-gutter',
      'mt-8',
      'group-data-[depth=SKIM]/depth:hidden',
    ],
    content: ['w-full', 'lg:col-start-2 lg:row-start-1'],
    // The cap sits on the children, not the box: a `data-full-bleed` child's
    // `min(100vw, var(--container-page))` must resolve against `content`'s width.
    prose: [
      '[&>*:not([data-full-bleed])]:mx-auto',
      '[&>*:not([data-full-bleed])]:max-w-measure',
      '[&>*:not([data-full-bleed])]:lg:mx-0',
      '[&>*+*]:mt-6',
    ],
    // `text-prose` matches `Prose`'s font-size, since `ch` resolves against
    // font-size and `max-w-measure`'s `68ch` must land at the same px width
    // as `Prose`'s own text.
    rail: [
      'mx-auto max-w-measure text-prose',
      'lg:col-start-1 lg:row-start-1 lg:row-span-2 lg:mx-0 lg:max-w-none',
    ],
    // The content→footer vertical gap comes from `Article.Footer`'s own
    // `mt-8` (`article-footer-variants.ts`), not a grid row-gap here.
    footerInRail: [
      'mx-auto text-prose',
      'max-w-measure',
      'lg:col-start-2 lg:row-start-2 lg:mx-0',
      'group-data-[depth=SKIM]/depth:hidden',
    ],
    footer: ['group-data-[depth=SKIM]/depth:hidden'],
    coverImage: ['size-full object-cover'],
    metaActions: ['inline-flex items-center gap-2'],
  },
  variants: {
    // `body` itself carries no measure cap — `rail`/`footerInRail`/`content`
    // each cap their own width instead.
    withRail: {
      true: {
        body: ['lg:max-w-page', 'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10'],
        // Scopes `ImageWithCaption`'s `FULL_BLEED` breakout (`min(100vw,
        // var(--container-page))`) to this column's own width instead of the
        // page-wide cap, so it doesn't bleed into the rail; `lg:`-scoped
        // since the grid (and rail) only exist at `lg:` and up.
        content: ['lg:[--container-page:100%]'],
      },
      false: {
        body: ['max-w-measure'],
      },
    },
  },
  defaultVariants: {
    withRail: false,
  },
});
