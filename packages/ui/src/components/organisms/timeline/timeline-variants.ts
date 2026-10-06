import {
  CONTENT_ALIGNMENT,
  TIMELINE_MARKER_STYLE,
  TIMELINE_ORIENTATION,
} from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const timelineVariants = tv({
  slots: {
    root: ['relative flex flex-col', 'm-0 list-none p-0'],
  },
  variants: {
    orientation: {
      [TIMELINE_ORIENTATION.VERTICAL]: {},
      [TIMELINE_ORIENTATION.HORIZONTAL]: {
        root: ['lg:flex-row lg:items-start lg:gap-10'],
      },
    },
    itemAlignment: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: {},
    },
    markerStyle: {
      [TIMELINE_MARKER_STYLE.NUMBERED]: {},
      [TIMELINE_MARKER_STYLE.LABELLED]: {},
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
