import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';

export const NESTED_TRIGGER_CLASSES = [
  'border border-platform-side-field-line bg-platform-side-field outline-none',
  'hover:border-platform-side-field-line hover:bg-platform-popover-hover',
  'data-[popup-open]:border-platform-side-accent data-[popup-open]:bg-platform-side-field',
  focusRingClasses(FOCUS_RING_GROUND.POPOVER),
];

export const nestableMenuTriggerVariants = tv({
  slots: {
    trigger: [],
  },
});
