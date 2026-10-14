import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const timelineVariants = tv({
  slots: {
    root: ['w-full [--timeline-gap:--spacing(6)]'],
    itemShare: ['w-full'],
    list: [
      'relative flex flex-col gap-x-(--timeline-gap)',
      'm-0 list-none p-0',
    ],
  },
  variants: {
    orientation: {
      [TIMELINE_ORIENTATION.VERTICAL]: {},
      [TIMELINE_ORIENTATION.HORIZONTAL]: {
        // One item's share of the width, so a single container threshold holds for any item count.
        itemShare: ['@container/timeline w-[calc(100%/var(--timeline-items))]'],
        list: [
          'w-[calc(100%*var(--timeline-items))]',
          '@min-[9rem]/timeline:flex-row @min-[9rem]/timeline:items-start',
        ],
      },
    },
    itemAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: {},
    },
    markerStyle: {
      [TIMELINE_MARKER_STYLE.NUMBERED]: {
        root: ['[--timeline-marker-track:--spacing(8)]'],
      },
      [TIMELINE_MARKER_STYLE.LABELLED]: {
        root: ['[--timeline-marker-track:--spacing(12)]'],
      },
    },
  },
  compoundVariants: [
    {
      orientation: TIMELINE_ORIENTATION.VERTICAL,
      itemAlignment: CONTENT_ALIGNMENT.CENTER,
      class: { root: ['mx-auto max-w-md'] },
    },
  ],
});
