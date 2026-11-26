import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';
import { tv } from '@platform/utils/tv/tv';

export const pinnedTenantTileVariants = tv({
  slots: {
    root: [
      'grid min-w-0 grid-cols-[minmax(0,1fr)_auto]',
      'max-md:w-64 max-md:shrink-0 max-md:snap-start',
    ],
    link: [
      'col-span-2 col-start-1 row-start-1 grid grid-cols-subgrid content-start gap-y-2.5 p-3',
      'rounded-platform-control border border-platform-control-line bg-platform-surface',
      'hover:bg-platform-hover-tint',
      COLOUR_TRANSITION_CLASSES,
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    header: ['col-start-1 flex min-w-0 items-center gap-2.5'],
    lines: ['min-w-0'],
    name: [
      'block truncate text-platform-13-5 font-semibold text-platform-text',
    ],
    domain: ['block truncate text-platform-12 text-platform-muted'],
    badges: ['col-span-2 flex flex-wrap items-center gap-2'],
    unpin: [
      'col-start-2 row-start-1 m-2.5 self-start',
      'text-platform-text [&>svg]:fill-current',
    ],
  },
});
