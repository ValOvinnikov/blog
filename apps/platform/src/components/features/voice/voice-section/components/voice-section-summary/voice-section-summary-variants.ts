import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { insetFocusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const voiceSectionSummaryVariants = tv({
  slots: {
    list: [
      'overflow-hidden rounded-admin border border-admin-line bg-admin-surface',
    ],
    item: ['border-t border-admin-line-2 first:border-t-0'],
    row: [
      'flex min-h-12 items-center gap-3 px-4 py-2.5 md:px-[18px]',
      'text-admin-text no-underline hover:bg-admin-surface-2',
      insetFocusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    name: [
      'min-w-0 flex-1 truncate text-admin-13-5 leading-4 font-semibold',
      'md:w-[150px] md:flex-none lg:w-[180px]',
    ],
    description: [
      'hidden min-w-0 flex-1 truncate text-admin-12-5 leading-4 text-admin-muted md:block',
    ],
    count: [
      'mr-1.5 hidden text-admin-12 leading-[15px] whitespace-nowrap text-admin-muted md:block',
    ],
    chevron: ['shrink-0 text-admin-muted'],
  },
});
