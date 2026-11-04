import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const fullPathMenuVariants = tv({
  slots: {
    trigger: [
      'flex h-11 min-w-11 items-center justify-center rounded-admin-control px-1.5',
      'border border-admin-control-line bg-admin-surface text-admin-14 font-semibold text-admin-text',
      'transition-colors duration-base ease-smooth',
      'hover:border-admin-brand-ink data-[popup-open]:border-admin-brand-ink',
      focusRingClasses(FOCUS_RING_GROUND.BG),
    ],
    popup: ['w-[220px]'],
  },
});
