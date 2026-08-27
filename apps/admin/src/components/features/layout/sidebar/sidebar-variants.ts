import { tv } from '@admin/utils/tv/tv';

export const sidebarVariants = tv({
  slots: {
    root: [
      // The rail's dark surface is a deliberate component treatment (its own
      // `--admin-side*` token family), not the app-wide light theme flipped —
      // admin ships one light theme with no `.dark` root class.
      // Hidden below `md:` — mobile nav lives in Topbar's compact menu
      // instead (TopbarNavMenu), never this unbounded full-height stack.
      'hidden w-full shrink-0 flex-col border-b border-admin-side-line bg-admin-side text-admin-side-text',
      'md:flex md:min-h-dvh md:w-[264px] md:border-r md:border-b-0',
      'md:sticky md:top-0 md:self-start',
    ],
    brand: [
      'flex items-center gap-2.5 border-b border-admin-side-line px-[18px] py-4',
    ],
    brandMeta: ['flex min-w-0 flex-col'],
    brandName: ['text-sm font-bold tracking-[0.2px] text-white'],
    brandTagline: ['text-xs text-admin-faint'],
    switcherSlot: ['px-3 pt-3 pb-1'],
    section: ['flex flex-col gap-1.5 px-3 pt-[14px]'],
    sectionLabel: [
      'px-2.5 pb-1.5 text-[10.5px] font-bold tracking-[0.09em] text-admin-muted uppercase',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      'group flex items-center gap-2.5 rounded-admin-sm px-2.5 py-2 text-[13px]',
      'transition-colors duration-base ease-console',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
    ],
    // `aria-current="page"` lands on the row itself (the link `SidebarNavLink`
    // renders, or never, for the static inert row) — the icon reads it off
    // its own ancestor via `group-aria-*` rather than a separate state prop.
    rowIcon: [
      'opacity-75 transition-opacity duration-base ease-console',
      'group-aria-[current=page]:text-admin-side-accent group-aria-[current=page]:opacity-100',
    ],
    rowBody: ['flex min-w-0 flex-1 flex-col'],
    rowLabel: ['truncate'],
    rowReason: ['truncate text-[11px] text-admin-faint'],
    badgeSlot: ['ml-auto shrink-0'],
    note: ['px-2.5 text-xs text-admin-faint'],
  },
  variants: {
    state: {
      active: {
        row: ['bg-admin-side-raised text-white'],
      },
      resting: {
        row: ['text-admin-side-text', 'hover:bg-admin-side-line'],
      },
      // Not dimmed: the label is the only way to learn this destination's
      // name, so it stays at full legibility — the badge carries the
      // "not available yet" signal instead.
      inert: { row: ['text-admin-side-text'] },
    },
  },
  defaultVariants: {
    state: 'resting',
  },
});
