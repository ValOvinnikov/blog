import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const voiceSectionChipVariants = tv({
  slots: {
    item: ['flex shrink-0'],
    link: [
      'flex h-11 items-center gap-2 rounded-full border px-3.5 whitespace-nowrap no-underline md:h-8 md:px-3',
      'text-admin-13-5 leading-4 font-semibold md:text-admin-13',
      focusRingClasses(FOCUS_RING_GROUND.SURFACE),
    ],
    count: ['text-admin-12 leading-admin-15 font-medium'],
  },
  variants: {
    isActive: {
      false: {
        link: [
          'border-admin-control-line bg-admin-surface text-admin-text hover:bg-admin-surface-2',
        ],
        count: ['text-admin-muted'],
      },
      true: {
        link: [
          'border-admin-brand bg-admin-brand text-white',
          'hover:border-admin-brand-hover hover:bg-admin-brand-hover',
        ],
        count: ['text-white'],
      },
    },
  },
});
