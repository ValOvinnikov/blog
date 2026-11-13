import { ACCORDION_VARIANT } from '@platform/constants/accordion';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import {
  focusRingClasses,
  insetFocusRingClasses,
} from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';
import { tv } from '@platform/utils/tv/tv';

export const accordionVariants = tv({
  slots: {
    root: ['flex flex-col'],
    item: [],
    header: ['m-0'],
    trigger: [
      'group/accordion-trigger flex w-full cursor-pointer items-center text-left',
      COLOUR_TRANSITION_CLASSES,
      'hover:bg-platform-surface-2',
    ],
    chevron: [
      'shrink-0 text-platform-muted',
      'transition-transform duration-150 ease-smooth motion-reduce:transition-none',
      'group-data-[panel-open]/accordion-trigger:rotate-90',
    ],
    rowLabel: [
      'flex min-w-0 flex-1 items-center gap-3',
      'max-lg:flex-col max-lg:items-stretch max-lg:gap-0.5',
    ],
    rowTitle: [
      'flex shrink-0 items-center gap-2 text-platform-14 font-semibold text-platform-text lg:w-[132px]',
    ],
    rowSummary: [
      'flex min-w-0 flex-1 items-center gap-2 text-platform-13 text-platform-muted max-lg:text-platform-12-5',
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
        root: ['md:border-b md:border-platform-line-2'],
        item: ['border-t border-platform-line-2'],
        trigger: [
          'min-h-11 gap-3 rounded-platform-control px-2.5 py-3',
          'max-md:min-h-[52px] max-md:gap-2.5 max-md:rounded-none max-md:px-1 max-md:py-2',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE),
        ],
        panel: ['bg-platform-surface-2'],
        panelContent: ['px-2.5 pb-3.5'],
      },
      [ACCORDION_VARIANT.ROW]: {
        item: ['relative border-t border-platform-line-2'],
        trigger: [
          'min-h-[52px] gap-3 px-4 font-normal focus-visible:rounded-platform-control max-lg:min-h-14',
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
          'bg-platform-surface-2',
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
        item: [
          'bg-platform-surface',
          'after:pointer-events-none after:absolute after:inset-y-0 after:left-0 after:w-[3px] after:bg-platform-brand',
        ],
        trigger: ['max-lg:min-h-12'],
      },
    },
  ],
  defaultVariants: {
    variant: ACCORDION_VARIANT.LIST,
  },
});
