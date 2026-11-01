import { tv } from '@platform/utils/tv/tv';

export const sidebarVariants = tv({
  slots: {
    root: [
      'hidden w-full shrink-0 flex-col border-b border-admin-side-line bg-admin-side text-admin-side-text',
      'md:flex md:h-dvh md:w-[264px] md:overflow-y-auto md:border-r md:border-b-0',
      'md:sticky md:top-0 md:self-start',
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
    brandName: [
      'text-admin-14 font-bold tracking-[0.2px] text-admin-text-strong',
    ],
    brandTagline: ['text-admin-12 text-admin-side-muted'],
    toggle: ['ml-auto group-data-[collapsed=true]/shell:ml-0'],
    switcherSlot: [
      'px-3 pt-3 pb-1',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    section: ['flex flex-col gap-1.5 px-3 pt-[14px]'],
    sectionLabel: [
      'truncate px-2.5 pb-1.5 text-admin-11 font-bold tracking-[0.09em] text-admin-side-muted uppercase',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      'group relative flex items-center gap-2.5 rounded-admin-control px-2.5 py-2 text-admin-13',
      'transition-colors duration-base ease-smooth',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-side-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-admin-side',
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0',
    ],
    note: [
      'px-2.5 text-admin-12 leading-4 text-admin-side-muted',
      'group-data-[collapsed=true]/shell:hidden',
    ],
  },
  variants: {
    state: {
      active: {
        row: [
          'bg-admin-side-raised font-semibold text-admin-text-strong shadow-admin',
          'focus-visible:shadow-none',
          'before:absolute before:inset-y-2 before:left-0 before:w-[3px] before:rounded-r-admin-bar before:bg-admin-side-accent',
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
