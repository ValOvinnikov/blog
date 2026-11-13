import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const voiceSectionSummaryVariants = tv({
  slots: {
    list: [
      'overflow-hidden rounded-platform border border-platform-line bg-platform-surface',
    ],
    item: ['border-t border-platform-line-2 first:border-t-0'],
    row: [
      'flex min-h-12 items-center gap-3 px-4 py-2.5 md:px-platform-card',
      'text-platform-text no-underline hover:bg-platform-surface-2',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    name: [
      'min-w-0 flex-1 truncate text-platform-13-5 leading-4 font-semibold',
      'md:w-[150px] md:flex-none lg:w-[180px]',
    ],
    description: [
      'hidden min-w-0 flex-1 truncate text-platform-12-5 leading-4 text-platform-muted md:block',
    ],
    count: [
      'mr-1.5 hidden text-platform-12 leading-platform-15 whitespace-nowrap text-platform-muted md:block',
    ],
    chevron: ['shrink-0 text-platform-muted'],
  },
});
