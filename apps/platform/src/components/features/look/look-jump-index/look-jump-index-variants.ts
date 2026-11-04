import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

// Matches the fades' w-10, so a scrolled-to link clears the fade on its side.
export const LOOK_INDEX_FADE_WIDTH_PX = 40;

const DIVIDER = 'h-5 w-px shrink-0 bg-admin-line mx-1';

export const lookJumpIndexVariants = tv({
  slots: {
    root: [
      'sticky z-20 top-[calc(var(--spacing-admin-topbar)+var(--spacing-admin-view-tabs))]',
      '@min-look-split:top-admin-topbar',
    ],
    bar: ['flex items-center'],
    scroller: ['relative flex min-w-0 flex-1'],
    list: [
      'm-0 flex min-w-0 flex-1 list-none items-center overflow-x-auto p-0',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    item: ['flex shrink-0'],
    divider: [DIVIDER],
    groupLink: [
      'flex h-8 items-center rounded-admin-control pr-1.5 pl-2.5 whitespace-nowrap no-underline',
      'text-admin-11 font-semibold tracking-[0.06em] text-admin-muted uppercase hover:text-admin-text',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    groupLabel: [
      'pr-0.5 pl-1.5 whitespace-nowrap',
      'text-admin-11 font-semibold tracking-[0.06em] text-admin-muted uppercase',
    ],
    fade: ['pointer-events-none absolute inset-y-0 w-10'],
    fadeStart: ['left-0 bg-linear-to-r'],
    fadeEnd: ['right-0 bg-linear-to-l'],
    toggleDivider: [DIVIDER],
    toggle: [
      'h-8 min-h-0 shrink-0 px-2.5 py-0 whitespace-nowrap',
      'text-admin-13 font-semibold text-admin-brand-strong',
    ],
  },
  variants: {
    isPhone: {
      true: {
        root: ['-mt-3.5 border-b border-admin-line bg-admin-bg py-2.5 pl-4'],
        list: ['gap-1.5'],
        fade: ['from-admin-bg to-admin-fade-end'],
      },
      false: {
        root: ['bg-admin-bg'],
        bar: [
          'gap-1 rounded-admin border border-admin-line bg-admin-surface p-1.5 shadow-admin-index',
        ],
        list: ['gap-0.5'],
        fade: ['from-admin-surface to-admin-fade-end-surface'],
      },
    },
  },
});
