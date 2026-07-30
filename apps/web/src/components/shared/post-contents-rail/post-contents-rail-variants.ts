import { tv } from 'tailwind-variants';

export const postContentsRailVariants = tv({
  slots: {
    // `sticky` lives here, on the root `<nav>`, not on the inner `mobile`
    // bar — deliberately. A `position: sticky` element can only travel
    // within its own DOM parent's box ("containing block"): the parent must
    // be taller than the sticky child for it to have any room to visually
    // pin in place while the page scrolls. `mobile`'s own parent is this
    // `root` `<nav>`, whose *own* box (at `< lg`, with the `desktop` sibling
    // `display:none`) is exactly as tall as `mobile` itself — zero travel
    // room, so a `sticky` class directly on `mobile` computes correctly but
    // never visibly pins. `root`'s own parent, one level up, is
    // `BlogPostPage`'s `Article.Body`, which — at `< lg` where it's a plain
    // block, not the two-column grid — stacks `root` above the full article
    // body as flow siblings, making `Article.Body` genuinely as tall as the
    // whole post. Stickying `root` against *that* containing block gives it
    // real room to pin below the site `Header` for the entire scroll of the
    // post, same as the desktop rail (whose own containing block is the
    // grid row, stretched to the content column's height by CSS Grid's
    // default `align-items: stretch`). `top-24` reuses the desktop rail's
    // own offset (see `desktop` above) rather than a second magic number,
    // so both presentations line up under the `Header` by the same gap.
    // `z-10` matches the `Header`'s own elevation tier — the two never
    // fight for the same pixels since this sits further down the viewport,
    // offset below the header by `top-24`. All of it is undone at `lg:` —
    // `static`/`top-auto`/`z-auto` restore this exact pre-change, unpositioned
    // root so the desktop grid-item/stretch behavior above is untouched.
    root: [
      'w-full min-w-0',
      'sticky top-24 z-10',
      'lg:static lg:top-auto lg:z-auto',
    ],
    desktop: [
      'hidden lg:block',
      'lg:sticky lg:top-24',
      'lg:border-r lg:border-border lg:pr-6',
    ],
    // `relative` (not `sticky` — see `root` above for why) makes this bar
    // its own positioning context, so `panel` below overlays precisely this
    // box rather than depending on `root`'s. `bg-bg` keeps the scrolling
    // article body from showing through the bar (and, via `panel` below,
    // the expanded overlay) once `root` is pinned mid-scroll.
    mobile: ['relative', 'bg-bg border-b border-border', 'mb-6', 'lg:hidden'],
    desktopLabel: [
      'mb-3 block',
      'font-mono text-label tracking-label uppercase text-text',
    ],
    toggle: [
      'flex w-full items-center gap-2 py-3',
      'font-mono text-label tracking-label uppercase text-text',
      'cursor-pointer border-0 bg-transparent p-0 text-left',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    toggleLabel: ['flex-1'],
    chevron: [
      'size-1.5 shrink-0 rotate-45 border-r-2 border-b-2 border-current',
      'transition-transform duration-base ease-console',
    ],
    // Positioned absolutely against the `relative` `mobile` bar above (its
    // own positioning context) so expanding it overlays the article body
    // beneath instead of pushing it down the page — matters most once
    // `root` is pinned mid-scroll. `max-h`+`overflow-y-auto` keeps a long
    // heading list from overrunning the viewport.
    panel: [
      'absolute inset-x-0 top-full',
      'bg-bg border-b border-border shadow-lg',
      'max-h-[70vh] overflow-y-auto',
      'pb-4',
    ],
    list: ['flex flex-col gap-2', 'font-mono text-copy', 'm-0 list-none p-0'],
    item: [],
    link: [
      'block text-subtle no-underline',
      'transition-colors duration-base ease-console',
      'hover:text-accent',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
  },
  variants: {
    open: {
      true: { chevron: ['-rotate-135'] },
    },
    isActive: {
      true: { link: ['text-accent'] },
    },
    isSubheading: {
      true: { item: ['pl-3'] },
    },
  },
});
