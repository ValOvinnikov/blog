import { tv } from '@platform/utils/tv/tv';

export const NAV_ROW_SHAPE =
  'group relative flex items-center gap-2.5 rounded-admin-control px-2.5 py-2 text-admin-13';

export const NAV_CURRENT_BAR =
  'before:absolute before:left-0 before:w-admin-bar before:rounded-r-admin-bar';

export const sidebarVariants = tv({
  slots: {
    root: [
      'hidden w-full shrink-0 flex-col border-b border-admin-side-line bg-admin-side text-admin-side-text',
      'md:flex md:h-dvh md:w-admin-sidebar md:border-r md:border-b-0',
      'md:sticky md:top-0 md:self-start',
      'group-data-[collapsed=true]/shell:md:w-admin-rail',
    ],
    brand: [
      'flex flex-none items-center border-b border-admin-side-line px-[18px] py-4',
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-2',
    ],
    brandExpanded: [
      'flex min-w-0 flex-col gap-[5px]',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    brandCollapsed: ['hidden', 'group-data-[collapsed=true]/shell:block'],
    // Starts where the full logo's lettering starts at its 28px height.
    brandTagline: ['pl-9 text-admin-12 font-medium text-admin-side-muted'],
    switcherSlot: [
      'flex-none px-3 pt-3 pb-1',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    navArea: ['min-h-0 flex-1 overflow-y-auto pb-[14px]'],
    foot: ['flex-none border-t border-admin-side-line p-3'],
    section: ['flex flex-col gap-1.5 px-3 pt-[14px]'],
    sectionLabel: [
      'truncate px-2.5 pb-1.5 text-admin-11 font-bold tracking-admin-label text-admin-side-muted uppercase',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      NAV_ROW_SHAPE,
      'transition-colors duration-base ease-smooth',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-side-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-side',
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0',
    ],
    note: [
      'px-2.5 text-admin-12 leading-4 text-admin-side-muted',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    railDescription: ['sr-only'],
  },
  variants: {
    state: {
      active: {
        row: [
          'bg-admin-side-raised font-semibold text-admin-text-strong shadow-admin',
          'focus-visible:shadow-none',
          NAV_CURRENT_BAR,
          'before:inset-y-2 before:bg-admin-side-accent',
        ],
      },
      resting: {
        row: ['text-admin-side-text', 'hover:bg-admin-side-line'],
      },
      // Dimmed only when collapsed, where the badge that marks it unavailable is hidden.
      inert: {
        row: [
          'text-admin-side-text',
          'group-data-[collapsed=true]/shell:opacity-50',
        ],
      },
    },
  },
  defaultVariants: {
    state: 'resting',
  },
});
