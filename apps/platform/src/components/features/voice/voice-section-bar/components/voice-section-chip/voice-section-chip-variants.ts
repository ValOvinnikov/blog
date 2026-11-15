import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { SELECTED_COMPACT_FILL_CLASSES } from '@platform/utils/selected-choice-classes/selected-choice-classes';
import { tv } from '@platform/utils/tv/tv';

export const voiceSectionChipVariants = tv({
  slots: {
    item: ['flex shrink-0'],
    link: [
      'flex h-11 items-center gap-2 rounded-full border px-3.5 whitespace-nowrap no-underline md:h-8 md:px-3',
      'text-platform-13-5 leading-4 font-semibold md:text-platform-13',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    count: ['text-platform-12 leading-platform-15 font-medium'],
    errorPill: [
      'inline-flex items-center justify-center gap-1 text-platform-12 leading-platform-15 font-semibold text-platform-bad',
    ],
  },
  variants: {
    isActive: {
      false: {
        link: [
          'border-platform-control-line bg-platform-surface text-platform-text hover:bg-platform-hover-tint',
        ],
        count: ['text-platform-muted'],
      },
      true: {
        link: [SELECTED_COMPACT_FILL_CLASSES],
        count: ['text-platform-on-selected'],
        errorPill: ['h-5 rounded-full bg-platform-surface px-1.5'],
      },
    },
  },
});
