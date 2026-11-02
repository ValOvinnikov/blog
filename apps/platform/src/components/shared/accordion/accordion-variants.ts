import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const accordionVariants = tv({
  slots: {
    root: ['flex flex-col md:border-b md:border-admin-line-2'],
    item: ['border-t border-admin-line-2'],
    header: ['m-0'],
    trigger: [
      'group/accordion-trigger flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-admin-control px-2.5 py-3 text-left',
      'max-md:min-h-[52px] max-md:gap-2.5 max-md:rounded-none max-md:px-1 max-md:py-2',
      'transition-colors duration-base ease-smooth hover:bg-admin-surface-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    chevron: [
      'shrink-0 text-admin-muted',
      'transition-transform duration-150 ease-smooth motion-reduce:transition-none',
      'group-data-[panel-open]/accordion-trigger:rotate-90',
    ],
    panel: [
      'h-(--accordion-panel-height) overflow-hidden bg-admin-surface-2',
      'transition-[height] duration-slow ease-smooth motion-reduce:transition-none',
      'data-[starting-style]:h-0 data-[ending-style]:h-0',
    ],
    panelContent: ['px-2.5 pb-3.5'],
  },
  variants: {
    isFirst: {
      true: { item: ['max-md:border-t-0'] },
    },
    isOpen: {
      true: {
        trigger: [
          'bg-admin-surface-2',
          focusRingClasses(FOCUS_RING_GROUND.SURFACE_2),
        ],
      },
    },
  },
});
