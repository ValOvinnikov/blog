import { tv } from '@platform/utils/tv/tv';

// Matches the fades' w-10, so a scrolled-to link clears the fade on its side.
export const LOOK_INDEX_FADE_WIDTH_PX = 40;

export const LOOK_INDEX_DIVIDER = 'mx-1 h-5 w-px shrink-0 bg-platform-line';

export const lookJumpIndexVariants = tv({
  slots: {
    root: [
      'sticky z-20 top-[calc(var(--spacing-platform-topbar)+var(--spacing-platform-view-tabs))]',
      '@min-look-split:top-platform-topbar',
      '[html:has(&)]:scroll-pt-[calc(var(--platform-topbar)+var(--platform-look-index))]!',
      // The tablist is the div just before the index; `div+` outranks the tablist's own padding.
      '[html:has(div+&)]:scroll-pt-[calc(var(--platform-topbar)+var(--platform-view-tabs)+var(--platform-look-index))]!',
    ],
    bar: ['flex items-center'],
    scroller: ['relative flex min-w-0 flex-1'],
    list: [
      'm-0 flex min-w-0 flex-1 list-none items-center overflow-x-auto p-0',
      '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
    ],
    divider: [LOOK_INDEX_DIVIDER],
    fade: ['pointer-events-none absolute inset-y-0 w-10'],
    fadeStart: ['left-0 bg-linear-to-r'],
    fadeEnd: ['right-0 bg-linear-to-l'],
    toggle: [
      'h-8 min-h-0 shrink-0 px-2.5 py-0 whitespace-nowrap',
      'text-platform-13 font-semibold text-platform-brand-strong',
    ],
  },
  variants: {
    isPhone: {
      true: {
        root: [
          '-mt-3.5 border-b border-platform-line bg-platform-bg py-2.5 pl-4',
        ],
        list: ['gap-1.5'],
        fade: ['from-platform-bg to-platform-fade-end'],
      },
      false: {
        root: ['bg-platform-bg'],
        bar: [
          'gap-1 rounded-platform border border-platform-line bg-platform-surface p-1.5 shadow-platform-index',
        ],
        list: ['gap-0.5'],
        fade: ['from-platform-surface to-platform-fade-end-surface'],
      },
    },
  },
});
