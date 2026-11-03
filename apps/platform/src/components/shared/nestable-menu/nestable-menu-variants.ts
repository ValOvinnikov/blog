import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const nestableMenuVariants = tv({
  slots: {
    trigger: [],
  },
  variants: {
    isNested: {
      true: {
        trigger: [
          'border border-admin-side-field-line bg-admin-side-field outline-none',
          'hover:border-admin-side-field-line hover:bg-admin-popover-hover',
          'data-[popup-open]:border-admin-side-accent data-[popup-open]:bg-admin-side-field',
          focusRingClasses(FOCUS_RING_GROUND.POPOVER),
        ],
      },
    },
  },
});
