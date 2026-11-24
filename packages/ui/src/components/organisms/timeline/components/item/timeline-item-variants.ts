import { CONTENT_ALIGNMENT, TIMELINE_ORIENTATION } from '@shinefold/config';
import { tv } from '@shinefold/ui/lib/styling';

export const timelineItemVariants = tv({
  slots: {
    root: [
      'relative col-span-full grid grid-cols-subgrid items-start gap-4',
      'pb-8 last:pb-0',
      'before:absolute before:col-[1/2] before:inset-x-0 before:top-8 before:bottom-0 before:mx-auto before:w-px before:bg-divider before:content-[""]',
      'last:before:hidden',
    ],
    marker: ['relative row-span-full self-start justify-self-center'],
    content: ['col-start-2 flex min-w-0 flex-col gap-1'],
  },
  variants: {
    orientation: {
      [TIMELINE_ORIENTATION.VERTICAL]: {},
      // 9rem of the timeline per item is the narrowest a step stays readable, gap included.
      [TIMELINE_ORIENTATION.HORIZONTAL]: {
        root: [
          '@min-[9rem]/timeline:min-w-0 @min-[9rem]/timeline:flex-1 @min-[9rem]/timeline:grid-cols-1 @min-[9rem]/timeline:pb-0',
          '@min-[9rem]/timeline:before:top-4 @min-[9rem]/timeline:before:bottom-auto @min-[9rem]/timeline:before:mx-0 @min-[9rem]/timeline:before:h-px @min-[9rem]/timeline:before:w-auto',
        ],
        marker: ['@min-[9rem]/timeline:row-span-1'],
        content: ['@min-[9rem]/timeline:col-start-1'],
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
        root: ['@min-[9rem]/timeline:before:-right-(--timeline-gap)'],
        marker: ['@min-[9rem]/timeline:justify-self-start'],
        content: ['@min-[9rem]/timeline:text-left'],
      },
    },
    {
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
      class: {
        root: [
          '@min-[9rem]/timeline:before:left-1/2 @min-[9rem]/timeline:before:-right-[calc(50%+var(--timeline-gap))]',
        ],
        marker: ['@min-[9rem]/timeline:justify-self-center'],
        content: ['@min-[9rem]/timeline:text-center'],
      },
    },
  ],
});
