import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';

export const BAR_CONTROL_CLASSES = [
  'rounded-admin-control border border-admin-control-line bg-admin-surface',
  'transition-colors duration-base ease-smooth',
  'hover:border-admin-brand-ink data-[popup-open]:border-admin-brand-ink',
  focusRingClasses(FOCUS_RING_GROUND.BG),
];
