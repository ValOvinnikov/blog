import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';

export const BAR_CONTROL_CLASSES = [
  'rounded-platform-control border border-platform-control-line bg-platform-surface',
  'cursor-pointer',
  COLOUR_TRANSITION_CLASSES,
  'hover:border-platform-brand-ink data-[popup-open]:border-platform-brand-ink',
  focusRingClasses(FOCUS_RING_GROUND.BG),
];
