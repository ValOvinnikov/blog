import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const NAV_ROW_SHAPE =
  'group relative flex items-center gap-2.5 rounded-platform-control px-2.5 py-2 text-platform-13';

export const NAV_CURRENT_BAR =
  'before:absolute before:left-0 before:w-platform-bar before:rounded-r-platform-bar';

export const sidebarVariants = tv({
  slots: {
    root: [
      'hidden w-full shrink-0 flex-col border-b border-platform-side-line bg-platform-side text-platform-side-text',
      'md:flex md:h-dvh md:w-platform-sidebar md:border-r md:border-b-0',
      'md:sticky md:top-0 md:self-start',
      'group-data-[collapsed=true]/shell:md:w-platform-rail',
    ],
    brand: [
      'flex flex-none items-center border-b border-platform-side-line px-[18px] py-4',
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-2',
    ],
    brandExpanded: [
      'flex min-w-0 flex-col gap-[5px]',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    brandCollapsed: ['hidden', 'group-data-[collapsed=true]/shell:block'],
    // Starts where the full logo's lettering starts at its 28px height.
    brandTagline: [
      'pl-9 text-platform-12 font-medium text-platform-side-muted',
    ],
    switcherSlot: [
      'flex-none px-3 pt-3 pb-1',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    navArea: ['min-h-0 flex-1 overflow-y-auto pb-[14px]'],
    foot: ['flex-none border-t border-platform-side-line p-3'],
    section: ['flex flex-col gap-1.5 px-3 pt-[14px]'],
    sectionLabel: [
      'truncate px-2.5 pb-1.5 text-platform-11 font-bold tracking-platform-label text-platform-side-muted uppercase',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    list: ['flex flex-col gap-0.5'],
    row: [
      NAV_ROW_SHAPE,
      'transition-colors duration-base ease-smooth',
      focusRingClasses(FOCUS_RING_GROUND.SIDE),
      'group-data-[collapsed=true]/shell:justify-center group-data-[collapsed=true]/shell:px-0',
    ],
    note: [
      'px-2.5 text-platform-12 leading-4 text-platform-side-muted',
      'group-data-[collapsed=true]/shell:hidden',
    ],
    railDescription: ['sr-only'],
  },
  variants: {
    state: {
      active: {
        row: [
          'bg-platform-side-raised font-semibold text-platform-brand-ink shadow-platform',
          NAV_CURRENT_BAR,
          'before:inset-y-2 before:bg-platform-side-accent',
        ],
      },
      resting: {
        row: ['text-platform-side-text', 'hover:bg-platform-side-line'],
      },
      // Dimmed only when collapsed, where the badge that marks it unavailable is hidden.
      inert: {
        row: [
          'text-platform-side-text',
          'group-data-[collapsed=true]/shell:opacity-50',
        ],
      },
    },
  },
  defaultVariants: {
    state: 'resting',
  },
});
