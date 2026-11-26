import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';
import { tv } from '@platform/utils/tv/tv';

export const pinnedTenantTileVariants = tv({
  slots: {
    root: ['relative min-w-0 max-md:w-64 max-md:shrink-0 max-md:snap-start'],
    link: [
      'flex h-full flex-col gap-2.5 p-3',
      'rounded-platform-control border border-platform-control-line bg-platform-surface',
      'hover:bg-platform-hover-tint',
      COLOUR_TRANSITION_CLASSES,
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    header: ['flex min-w-0 items-center gap-2.5 pr-11'],
    lines: ['min-w-0'],
    name: [
      'block truncate text-platform-13-5 font-semibold text-platform-text',
    ],
    domain: ['block truncate text-platform-12 text-platform-muted'],
    badges: ['flex flex-wrap items-center gap-2'],
    unpin: [
      'absolute top-2.5 right-2.5',
      'text-platform-text [&>svg]:fill-current',
    ],
  },
});
