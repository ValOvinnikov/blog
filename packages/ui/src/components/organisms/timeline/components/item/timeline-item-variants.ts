import { CONTENT_ALIGNMENT, TIMELINE_ORIENTATION } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const timelineItemVariants = tv({
  slots: {
    root: [
      'relative grid grid-cols-[3rem_1fr] items-start gap-x-4',
      'pb-8 last:pb-0',
      'before:absolute before:top-8 before:bottom-0 before:left-6 before:w-px before:bg-border before:content-[""]',
      'last:before:hidden',
    ],
    marker: ['relative row-span-full self-start justify-self-center'],
    content: ['col-start-2 flex min-w-0 flex-col gap-1'],
  },
  variants: {
    orientation: {
      [TIMELINE_ORIENTATION.VERTICAL]: {},
      [TIMELINE_ORIENTATION.HORIZONTAL]: {
        root: [
          'lg:grid-cols-1 lg:pb-0 lg:flex-1',
          'lg:before:top-4 lg:before:bottom-auto lg:before:h-px lg:before:bg-border',
        ],
        marker: ['lg:row-span-1'],
        content: ['lg:col-start-1 lg:gap-3'],
      },
    },
    itemAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: {},
    },
  },
  compoundVariants: [
    {
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.LEFT,
      class: {
        root: ['lg:before:inset-x-0 lg:before:w-auto'],
        marker: ['lg:justify-self-start'],
        content: ['lg:text-left'],
      },
    },
    {
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
      class: {
        root: ['lg:before:left-1/2 lg:before:right-[-50%] lg:before:w-auto'],
        marker: ['lg:justify-self-center'],
        content: ['lg:text-center'],
      },
    },
  ],
});
