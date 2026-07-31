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
    // default `align-items: stretch`). The base (`<lg`) `top-*` here is a
    // *different*, mobile-only number from `desktop`'s own `lg:top-24`
    // below — the two slots are never sticky at the same time (`lg:static`
    // clears this one the moment `desktop`'s `lg:sticky` takes over), so
    // reusing one magic number for both, as an earlier revision did, was
    // itself the bug: measured live (`390px` viewport, real `Header` +
    // `BrandLockup` render), the site `Header`'s own height is ~63px —
    // `top-24` (96px) overshoots it by ~33px, leaving a gap the article body
    // scrolls through underneath the pinned mobile bar. `top-16` (64px) is
    // the nearest Tailwind step to that measured 63px, so the bar lands
    // flush against the `Header`'s real bottom edge with no bleed-through.
    // `z-10` matches the `Header`'s own elevation tier — the two never
    // fight for the same pixels since this sits further down the viewport,
    // offset below the header by `top-16`. All of it is undone at `lg:` —
    // `static`/`top-auto`/`z-auto` restore this exact pre-change, unpositioned
    // root so the desktop grid-item/stretch behavior above is untouched.
    root: [
      'w-full min-w-0',
      'sticky top-16 z-10',
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
    // `px-4` insets the icon/label/chevron from the bar's own edges — this
    // bar renders as a bordered, backgrounded strip (see `mobile` above), so
    // (unlike plain reading-column text, which sits flush against the page's
    // own `px-gutter`) it reads as its own boxed control and needs its own
    // padding, same as `PrimaryNavigation`'s mobile dropdown toggle/panel
    // (`p-4`) one level up in the same `lg:hidden` disclosure pattern.
    // Deliberately no bare `p-0` alongside `px-4`/`py-3` here: `tv()`'s
    // built-in `tailwind-merge` treats `p-0` as the most-specific class for
    // *both* axes, so a trailing `p-0` was silently canceling the `py-3`
    // right next to it (confirmed against the live-rendered class list —
    // the button measured 16px tall, its icon's own height, with zero
    // padding on every side). Explicit `px-4 py-3` covers all four sides
    // without a conflicting shorthand, and Tailwind's own utility-class
    // selector already beats the browser's default `<button>` padding on
    // specificity, so dropping `p-0` doesn't reintroduce it.
    toggle: [
      'flex w-full items-center gap-2 px-4 py-3',
      'font-mono text-label tracking-label uppercase text-text',
      'cursor-pointer border-0 bg-transparent text-left',
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
    // `pt-4` (new — was unset) balances the existing `pb-4`: with no top
    // padding, the first item sat flush against the `mobile` bar's own
    // `border-b border-border` immediately above, so the border read as an
    // internal list rule rather than a boundary separating the "ON THIS
    // PAGE" toggle row from the list below it. Matching top/bottom padding
    // gives the divider room to breathe on both the title side and the list
    // side, so it reads as a clear section break instead of the two blocks
    // merging visually.
    panel: [
      'absolute inset-x-0 top-full',
      'bg-bg border-b border-border shadow-lg',
      'max-h-[70vh] overflow-y-auto px-4',
      'pt-4 pb-4',
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
    // `inPanel` replicates `PopoverMenuItem`'s row treatment (see
    // `packages/ui/src/molecules/popover-menu/components/item/
    // popover-menu-item-variants.ts`: `rounded-md px-3 py-2` + `hover:bg-
    // surface-2`) — minus its border (there isn't one to begin with) — onto
    // the rail's own `link` slot. `flex`/`block` are both block-level and
    // stay full-width, so this doesn't narrow the link's own box or its
    // focus ring — what changes is the box gaining rounded corners and
    // internal padding, giving it a "pill" look inside the still-full-width
    // row rather than a narrower, hugged box. It's scoped to
    // the mobile disclosure's own copy of the list only: `PostContentsRail`
    // passes it for the `renderList(close, true)` call inside `panel`, but
    // omits it for the plain `renderList()` call inside `desktop`, so the
    // sticky `lg:` side rail keeps its original plain-text look — the
    // reported broken edge-to-edge focus ring (a full-width `block` link's
    // ring spanning the entire panel width) and "needs share-menu-style
    // affordance" feedback were both specific to the mobile overlay, not the
    // narrow desktop column, and desktop must stay visually unchanged.
    // `flex items-center` here overrides the base `block` (tailwind-merge
    // resolves the conflicting display utility in favor of this, later,
    // class), giving the icon-less row the same alignment `PopoverMenuItem`
    // uses for its icon+label rows. `list`'s own `gap-1` override (down from
    // the shared `gap-2` above) is scoped here too: now that `link` carries
    // its own `py-2` in this variant, keeping the shared `gap-2` on top of
    // that padding read as oversized double-spacing between mobile panel
    // items; `gap-1` matches the spacing `PopoverMenu.Panel`'s own `flex
    // flex-col gap-1` uses around its `py-2`-padded `PopoverMenuItem` rows.
    // `list` is a single slot shared by both the desktop rail's plain
    // `renderList()` call and this mobile panel's `renderList(close, true)`
    // call, and desktop's `link` stays plain `block` with no added padding —
    // gating the tighter gap behind `inPanel` (rather than tightening the
    // shared slot directly) keeps desktop's own `gap-2` untouched.
    inPanel: {
      true: {
        link: ['flex items-center rounded-md px-3 py-2', 'hover:bg-surface-2'],
        list: ['gap-1'],
      },
    },
  },
});
