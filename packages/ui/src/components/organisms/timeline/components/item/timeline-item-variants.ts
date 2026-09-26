import { CONTENT_ALIGNMENT, TIMELINE_ORIENTATION } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const timelineItemVariants = tv({
  base: [
    'relative grid grid-cols-[3rem_1fr] items-start gap-x-4 gap-y-1',
    '[&>*:first-child]:row-span-full [&>*:first-child]:justify-self-center [&>*:first-child]:self-start',
    '[&>*:not(:first-child)]:col-start-2',
    'pb-8 last:pb-0',
    'before:absolute before:top-8 before:bottom-0 before:left-6 before:w-px before:bg-border before:content-[""]',
    'last:before:hidden',
  ],
  variants: {
    orientation: {
      [TIMELINE_ORIENTATION.VERTICAL]: [],
      [TIMELINE_ORIENTATION.HORIZONTAL]: [
        'lg:grid-cols-1 lg:gap-y-3 lg:pb-0 lg:flex-1',
        'lg:[&>*:first-child]:row-span-1',
        'lg:before:top-4 lg:before:bottom-auto lg:before:h-px lg:before:bg-border',
      ],
    },
    itemAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: [],
      [CONTENT_ALIGNMENT.CENTER]: [],
    },
  },
  compoundVariants: [
    {
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.LEFT,
      class: [
        'lg:[&>*:first-child]:justify-self-start',
        'lg:[&>*:not(:first-child)]:text-left',
        'lg:before:inset-x-0 lg:before:w-auto',
      ],
    },
    {
      orientation: TIMELINE_ORIENTATION.HORIZONTAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
      class: [
        'lg:[&>*:first-child]:justify-self-center',
        'lg:[&>*:not(:first-child)]:text-center',
        'lg:before:left-1/2 lg:before:right-[-50%] lg:before:w-auto',
      ],
    },
  ],
});
