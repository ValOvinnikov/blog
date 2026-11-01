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
        list: ['gap-[3px] rounded-admin-control bg-admin-line-2 p-[3px]'],
        tab: [
          'min-h-11 rounded-admin-control px-[14px] py-[7px] md:min-h-0',
          'text-admin-13 font-medium text-admin-muted',
          'data-[active]:bg-admin-surface data-[active]:text-admin-text data-[active]:not-focus-visible:shadow-admin',
          focusRingClasses(FOCUS_RING_GROUND.THEME_TRACK),
        ],
      },
      [VIEW_TABS_VARIANT.UNDERLINE]: {
        root: [
          'border-b border-admin-line bg-admin-surface px-4',
          'lg:rounded-admin lg:border lg:shadow-admin-index',
        ],
        tab: [
          'h-11 border-b-2 border-transparent text-center',
          'text-admin-14 font-medium text-admin-muted not-data-[active]:hover:text-admin-text',
          'data-[active]:border-admin-brand data-[active]:font-semibold data-[active]:text-admin-brand-strong',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
      },
    },
    isLgHidden: {
      true: { root: ['lg:hidden'] },
    },
    // 21 sits above the Look index (20) and below the tooltip (30).
    isSticky: {
      true: { root: ['sticky top-admin-topbar z-21'] },
    },
  },
  defaultVariants: { variant: VIEW_TABS_VARIANT.SEGMENTED },
});
