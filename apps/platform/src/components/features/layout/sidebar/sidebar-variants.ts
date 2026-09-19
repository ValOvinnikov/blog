import { tv } from '@platform/utils/tv/tv';

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
      // `Sidebar` never reads collapse state itself — `SidebarCollapseProvider`
      // (a `ShellFrame`-owned client ancestor) carries `data-collapsed` on
      // the `group/shell` element wrapping this whole subtree, and every
      // collapse-aware class below is a `group-data-*/shell` selector reacting
      // to it purely in CSS.
      'group-data-[collapsed=true]/shell:md:w-[76px]',
    ],
    brand: [
      'flex items-center gap-2.5 border-b border-admin-side-line px-[18px] py-4',
      'group-data-[collapsed=true]/shell:flex-col group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:gap-2 group-data-[collapsed=true]/shell:px-2',
    ],
    brandMeta: [
      'flex min-w-0 flex-col',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    brandName: ['text-sm font-bold tracking-[0.2px] text-white'],
    brandTagline: ['text-xs text-admin-faint'],
    toggle: ['ml-auto group-data-[collapsed=true]/shell:ml-0'],
    switcherSlot: [
      'px-3 pt-3 pb-1',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    section: ['flex flex-col gap-1.5 px-3 pt-[14px]'],
    sectionLabel: [
      'px-2.5 pb-1.5 text-[10.5px] font-bold tracking-[0.09em] text-admin-muted uppercase',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      'group flex items-center gap-2.5 rounded-admin-sm px-2.5 py-2 text-[13px]',
      'transition-colors duration-base ease-smooth',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-brand',
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0',
    ],
    note: [
      'px-2.5 text-xs text-admin-faint',
      'group-data-[collapsed=true]/shell:hidden',
    ],
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
