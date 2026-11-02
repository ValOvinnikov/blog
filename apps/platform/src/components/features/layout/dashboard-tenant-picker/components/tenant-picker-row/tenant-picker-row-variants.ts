import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const tenantPickerRowVariants = tv({
  slots: {
    row: [
      'group flex min-h-[60px] items-center gap-3.5 rounded-admin-control px-3.5 py-2.5 no-underline',
      'transition-colors duration-base ease-smooth hover:bg-admin-surface-2',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    tile: [
      'flex size-9 flex-none items-center justify-center rounded-admin-control',
      'bg-admin-line-2 text-admin-14 font-semibold text-admin-muted',
    ],
    text: ['flex min-w-0 flex-1 flex-col gap-0.5'],
    name: [
      'line-clamp-2 text-admin-14 leading-5 font-semibold text-admin-text [overflow-wrap:anywhere]',
    ],
    domain: ['truncate font-mono text-admin-12 text-admin-muted'],
    meta: [
      'flex flex-none gap-1.5 text-admin-13 whitespace-nowrap text-admin-muted',
    ],
    separator: ['text-admin-muted'],
    chevron: [
      'flex-none text-admin-faint transition-colors duration-base ease-smooth group-hover:text-admin-brand',
    ],
    chevronSpace: ['w-4 flex-none'],
  },
  variants: {
    isArchived: {
      true: {
        tile: ['border border-dashed border-admin-faint bg-transparent'],
        name: ['text-admin-muted'],
      },
    },
  },
});
