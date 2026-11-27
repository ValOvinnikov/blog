import {
  FOCUS_RING_GROUND,
  FOCUS_RING_TRIGGER,
} from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';

export const FIELD_SURFACE_CLASSES =
  'rounded-platform-control border px-[11px] py-[9px] text-platform-16 md:text-platform-13-5 text-platform-text bg-platform-surface border-platform-control-line';

export const FIELD_FOCUS_CLASSES = focusRingClasses(FOCUS_RING_GROUND.SURFACE);

export const FIELD_POPUP_OPEN_CLASSES =
  'data-[popup-open]:shadow-platform-focus-ring';

export const EDITABLE_SHELL_FOCUS_CLASSES = focusRingClasses(
  FOCUS_RING_GROUND.SURFACE,
  FOCUS_RING_TRIGGER.EDITABLE_FOCUS_VISIBLE,
);
