import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import {
  focusRingClasses,
  insetFocusRingClasses,
} from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const accordionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    item: [],
    header: ['m-0'],
    trigger: [
      'group/accordion-trigger flex w-full cursor-pointer items-center text-left',
      'transition-colors duration-base ease-smooth hover:bg-admin-surface-2',
    ],
    chevron: [
      'shrink-0 text-admin-muted',
      'transition-transform duration-150 ease-smooth motion-reduce:transition-none',
      'group-data-[panel-open]/accordion-trigger:rotate-90',
    ],
    rowLabel: [
      'flex min-w-0 flex-1 items-center gap-3',
      'max-lg:flex-col max-lg:items-stretch max-lg:gap-0.5',
    ],
    rowTitle: [
      'flex shrink-0 items-center gap-2 text-admin-14 font-semibold text-admin-text lg:w-[132px]',
    ],
    rowSummary: [
      'flex min-w-0 flex-1 items-center gap-2 text-admin-13 text-admin-muted max-lg:text-admin-12-5',
    ],
    rowSummaryMark: ['inline-flex shrink-0 items-center justify-center'],
    rowSummaryText: ['min-w-0 truncate'],
    rowTrailing: ['shrink-0'],
    panel: [
      'h-(--accordion-panel-height) overflow-hidden',
      'transition-[height] duration-slow ease-smooth motion-reduce:transition-none',
      'data-[starting-style]:h-0 data-[ending-style]:h-0',
    ],
    panelContent: [],
  },
  variants: {
    variant: {
      [ACCORDION_VARIANT.LIST]: {
        root: ['md:border-b md:border-admin-line-2'],
        item: ['border-t border-admin-line-2'],
        trigger: [
          'min-h-11 gap-3 rounded-admin-control px-2.5 py-3',
          'max-md:min-h-[52px] max-md:gap-2.5 max-md:rounded-none max-md:px-1 max-md:py-2',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
        panel: ['bg-admin-surface-2'],
        panelContent: ['px-2.5 pb-3.5'],
      },
      [ACCORDION_VARIANT.ROW]: {
        item: ['border-t border-admin-line-2'],
        trigger: [
          'min-h-[52px] gap-3 rounded-admin-control px-4 font-normal max-lg:min-h-14',
          insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
        panelContent: [
          'flex flex-col gap-4 pt-0.5 pr-4 pb-[18px] pl-11',
          'max-lg:px-4 max-lg:pt-0 max-lg:pb-4',
        ],
      },
    },
    isFirst: {
      true: {},
    },
    isOpen: {
      true: {},
    },
  },
  compoundVariants: [
    {
      variant: ACCORDION_VARIANT.LIST,
      isFirst: true,
      class: { item: ['max-md:border-t-0'] },
    },
    {
      variant: ACCORDION_VARIANT.LIST,
      isOpen: true,
      class: {
        trigger: [
          'bg-admin-surface-2',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE_2),
        ],
      },
    },
    {
      variant: ACCORDION_VARIANT.ROW,
      isFirst: true,
      class: { item: ['border-t-0'] },
    },
    {
      variant: ACCORDION_VARIANT.ROW,
      isOpen: true,
      class: {
        item: ['bg-admin-surface shadow-[inset_3px_0_0_var(--admin-brand)]'],
        trigger: ['max-lg:min-h-12'],
      },
    },
  ],
  defaultVariants: {
    variant: ACCORDION_VARIANT.LIST,
  },
});
