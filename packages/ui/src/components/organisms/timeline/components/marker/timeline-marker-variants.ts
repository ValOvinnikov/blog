import { TIMELINE_MARKER_STYLE } from '@blog/config';
import { BRAND_PILL, tv } from '@blog/ui/lib/styling';

export const timelineMarkerVariants = tv({
  base: [BRAND_PILL, 'h-8'],
  variants: {
    markerStyle: {
      [TIMELINE_MARKER_STYLE.NUMBERED]: ['w-8'],
      [TIMELINE_MARKER_STYLE.LABELLED]: ['min-w-11 px-2.5'],
    },
  },
});
