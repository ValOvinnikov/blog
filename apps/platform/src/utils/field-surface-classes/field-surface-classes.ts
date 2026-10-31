import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';

export const FIELD_SURFACE_CLASSES =
  'rounded-admin-control border px-[11px] py-[9px] text-admin-16 md:text-admin-13-5 text-admin-text bg-admin-surface border-admin-control-line';

export const FIELD_FOCUS_CLASSES = focusRingClasses(FOCUS_RING_GROUND.SURFACE);
