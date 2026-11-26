import { TIMELINE_MARKER_STYLE } from '@shinefold/config';
import { PILL, tv } from '@shinefold/ui/lib/styling';

export const timelineMarkerVariants = tv({
  base: [PILL, 'h-8 bg-timeline-marker-fill text-timeline-marker-numeral'],
  variants: {
    markerStyle: {
      [TIMELINE_MARKER_STYLE.NUMBERED]: ['w-8'],
      [TIMELINE_MARKER_STYLE.LABELLED]: ['min-w-11 px-2.5 whitespace-nowrap'],
    },
  },
});
