import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { COLOUR_TRANSITION_CLASSES } from '@platform/utils/transition-classes/transition-classes';

export const BAR_CONTROL_CLASSES = [
  'rounded-admin-control border border-admin-control-line bg-admin-surface',
  'cursor-pointer',
  COLOUR_TRANSITION_CLASSES,
  'hover:border-admin-brand-ink data-[popup-open]:border-admin-brand-ink',
  focusRingClasses(FOCUS_RING_GROUND.BG),
];
