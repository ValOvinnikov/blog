import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tenantPickerRowVariants = tv({
  slots: {
    row: [
      'group flex min-h-[60px] items-center gap-3.5 rounded-platform-control px-3.5 py-2.5 no-underline',
      'transition-colors duration-base ease-smooth hover:bg-platform-surface-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    tile: [
      'flex size-9 flex-none items-center justify-center rounded-platform-control',
      'bg-platform-line-2 text-platform-14 font-semibold text-platform-muted',
    ],
    text: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: [
      'line-clamp-2 text-platform-14 leading-5 font-semibold text-platform-text [overflow-wrap:anywhere]',
    ],
    domain: ['truncate font-mono text-platform-12 text-platform-muted'],
    meta: [
      'flex flex-none gap-1.5 text-platform-13 whitespace-nowrap text-platform-muted',
    ],
    separator: ['text-platform-muted'],
    chevron: [
      'flex-none text-platform-faint transition-colors duration-base ease-smooth group-hover:text-platform-brand',
    ],
    chevronSpace: ['w-4 flex-none'],
  },
  variants: {
    isArchived: {
      true: {
        tile: ['border border-dashed border-platform-faint bg-transparent'],
        name: ['text-platform-muted'],
      },
    },
  },
});
