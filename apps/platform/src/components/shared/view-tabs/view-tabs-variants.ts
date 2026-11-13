import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { VIEW_TABS_VARIANT } from '@platform/constants/view-tabs';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const viewTabsVariants = tv({
  slots: {
    root: [],
    list: ['grid grid-cols-2'],
    tab: ['cursor-pointer'],
  },
  variants: {
    variant: {
      [VIEW_TABS_VARIANT.SEGMENTED]: {
        list: ['gap-[3px] rounded-platform-control bg-platform-line-2 p-[3px]'],
        tab: [
          'min-h-11 rounded-platform-control px-[14px] py-[7px] md:min-h-0',
          'text-platform-13 font-medium text-platform-muted',
          'data-[active]:bg-platform-surface data-[active]:text-platform-text data-[active]:not-focus-visible:shadow-platform',
          focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
        ],
      },
      [VIEW_TABS_VARIANT.UNDERLINE]: {
        root: [
          'border-b-(length:--platform-view-tab-border) border-platform-line bg-platform-surface px-4',
          'lg:rounded-platform lg:border-(length:--platform-view-tab-border) lg:shadow-platform-index',
        ],
        tab: [
          'h-platform-view-tab border-b-2 border-transparent text-center',
          'text-platform-14 font-medium text-platform-muted not-data-[active]:hover:text-platform-text',
          'data-[active]:border-platform-brand data-[active]:font-semibold data-[active]:text-platform-brand-strong',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
      },
    },
    isLgHidden: {
      true: { root: ['lg:hidden'] },
    },
    // 21 sits above the Look index (20) and below the tooltip (30).
    isSticky: {
      true: {
        root: [
          'sticky top-platform-topbar z-21',
          '[html:has(&)]:scroll-pt-[calc(var(--platform-topbar)+var(--platform-view-tabs))]!',
        ],
      },
    },
  },
  defaultVariants: { variant: VIEW_TABS_VARIANT.SEGMENTED },
});
