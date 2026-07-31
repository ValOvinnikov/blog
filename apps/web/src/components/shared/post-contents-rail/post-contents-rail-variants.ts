import { tv } from 'tailwind-variants';

export const postContentsRailVariants = tv({
  slots: {
    // `sticky` lives on `root`, not `mobile`: `mobile`'s own parent box
    // (`root`, `< lg`) is exactly as tall as `mobile` itself, so it has no
    // room to pin — `root`'s parent (`Article.Body`) is the full post
    // height. `top-16` (64px) matches the measured `Header` height (~63px).
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
    // `relative` gives this bar its own positioning context so `panel`
    // overlays it directly rather than depending on `root`'s box.
    mobile: ['relative', 'bg-bg border-b border-border', 'mb-6', 'lg:hidden'],
    desktopLabel: [
      'mb-3 block',
      'font-mono text-label tracking-label uppercase text-text',
    ],
    // No bare `p-0` alongside `px-4`/`py-3`: `tv()`'s `tailwind-merge` treats
    // `p-0` as most-specific for both axes, silently canceling `py-3`.
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
    // Absolute against `mobile`'s `relative` box so it overlays the article
    // body instead of pushing it down. `pt-4` balances `pb-4` so the toggle
    // row's `border-b` reads as a section break, not an internal list rule.
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
    // Replicates `PopoverMenuItem`'s row chrome (rounded pill + hover fill)
    // on the mobile panel's copy of `link`/`list` only — the desktop rail's
    // `renderList()` call omits it, so the side column stays plain text.
    inPanel: {
      true: {
        link: ['flex items-center rounded-md px-3 py-2', 'hover:bg-surface-2'],
        list: ['gap-1'],
      },
    },
  },
});
