import { tv } from 'tailwind-variants';

export const postContentsRailVariants = tv({
  slots: {
    // `sticky` lives on `root`, not `mobile`: `mobile`'s own parent box
    // (`root`, `< lg`) is exactly as tall as `mobile` itself, so it has no
    // room to pin — `root`'s parent (`Article.Body`) is the full post
    // height. `top-20` (80px) adds a 16px gap below `top-16`'s Header-height
    // match, so a sliver of page background separates the stuck bar from the
    // Header (`shadow-md` alone reads flush against it). `headingAnchor`'s
    // mobile `scroll-mt-32` tracks this offset.
    root: [
      'w-full min-w-0',
      'sticky top-20 z-10',
      'lg:static lg:top-auto lg:z-auto',
    ],
    desktop: [
      'hidden lg:block',
      'lg:sticky lg:top-24',
      'lg:border-r lg:border-border lg:pr-6',
    ],
    // `relative` gives this bar its own positioning context so `panel`
    // overlays it directly rather than depending on `root`'s box.
    // `shadow-md` — this bar shares `Header`'s exact `bg-bg`/`border-border`,
    // so the hairline border alone doesn't read as a seam once it's sticky
    // flush beneath it (#981).
    mobile: [
      'relative',
      'bg-bg border-b border-border shadow-md',
      'px-4 py-3',
      'mb-6',
      'lg:hidden',
    ],
    desktopLabel: [
      'mb-3 block',
      'font-mono text-label tracking-label uppercase text-text',
    ],
    // Stacked below `md:` (label above a full-width selector); inline-left
    // at `md:`–`lg:` (label beside the selector in one row).
    selectorRow: [
      'flex flex-col gap-1.5',
      'md:flex-row md:items-center md:gap-3',
    ],
    mobileLabel: [
      'shrink-0',
      'font-mono text-label tracking-label uppercase text-subtle',
    ],
    // A bordered form-field look, not a flush bar — the label + current
    // topic text already convey it's expandable, so no leading icon.
    toggle: [
      'flex w-full min-w-0 items-center justify-between gap-2',
      'md:flex-1',
      'border border-border rounded-md bg-bg px-3 py-2.5',
      'font-mono text-copy text-text',
      'cursor-pointer text-left',
      'transition-colors duration-base ease-console',
      'hover:bg-surface-2',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    toggleLabel: ['flex-1 truncate'],
    chevron: [
      'size-1.5 shrink-0 rotate-45 border-r-2 border-b-2 border-current',
      'transition-transform duration-base ease-console',
    ],
    // Absolute against `mobile`'s `relative` box so it overlays the article
    // body instead of pushing it down. `p-4` matches the nav-menu and
    // share-post popover panels so all three read as one system (#1005).
    panel: [
      'absolute inset-x-0 top-full',
      'bg-bg border-b border-border shadow-lg',
      'max-h-[70vh] overflow-y-auto p-4',
    ],
    list: ['flex flex-col gap-1', 'font-mono text-copy', 'm-0 list-none p-0'],
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
    // Replicates `PopoverMenuItem`'s row chrome (rounded pill + hover fill)
    // on the mobile panel's copy of `link` only — the desktop rail's
    // `renderList()` call omits it, so the side column stays plain text.
    // `list`'s `gap-1` already matches on both, so no override is needed here.
    inPanel: {
      true: {
        link: ['flex items-center rounded-md px-3 py-2', 'hover:bg-surface-2'],
      },
    },
  },
});
