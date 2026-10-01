import { TIMELINE_MARKER_STYLE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

export const timelineMarkerVariants = tv({
  base: [
    'inline-flex h-8 items-center justify-center',
    'font-mono text-label font-medium',
    'bg-brand-primary-solid text-brand-primary-contrast',
  ],
  variants: {
    markerStyle: {
      [TIMELINE_MARKER_STYLE.NUMBERED]: ['w-8 rounded-full'],
      [TIMELINE_MARKER_STYLE.LABELLED]: ['min-w-11 rounded-full px-2.5'],
    },
  },
});
