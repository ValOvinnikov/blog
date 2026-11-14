import {
  FOCUS_RING_GROUND,
  FOCUS_RING_TRIGGER,
  type TFocusRingGround,
  type TFocusRingTrigger,
} from '@platform/constants/focus-ring';

// Whole literals: Tailwind only generates classes it finds spelled out in source.
const FOCUS_RING_GROUND_CLASSES: Record<TFocusRingGround, string> = {
  [FOCUS_RING_GROUND.SIDE]: '[--platform-focus-ground:var(--platform-side)]',
  [FOCUS_RING_GROUND.BG]: '[--platform-focus-ground:var(--platform-bg)]',
  [FOCUS_RING_GROUND.SURFACE]:
    '[--platform-focus-ground:var(--platform-surface)]',
  [FOCUS_RING_GROUND.SURFACE_2]:
    '[--platform-focus-ground:var(--platform-surface-2)]',
  [FOCUS_RING_GROUND.SURFACE_HEAD]:
    '[--platform-focus-ground:var(--platform-surface-head)]',
  [FOCUS_RING_GROUND.POPOVER]:
    '[--platform-focus-ground:var(--platform-popover)]',
  [FOCUS_RING_GROUND.POPOVER_HOVER]:
    '[--platform-focus-ground:var(--platform-popover-hover)]',
  [FOCUS_RING_GROUND.THEME_TRACK]:
    '[--platform-focus-ground:var(--platform-theme-track)]',
  [FOCUS_RING_GROUND.BRAND_WEAK]:
    '[--platform-focus-ground:var(--platform-brand-weak)]',
};

const FOCUS_RING_TRIGGER_CLASSES: Record<TFocusRingTrigger, string> = {
  [FOCUS_RING_TRIGGER.FOCUS_VISIBLE]:
    'focus-visible:outline-hidden focus-visible:shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.HIGHLIGHTED]:
    'data-[highlighted]:shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED]:
    'group-focus-visible:data-[highlighted]:shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.INNER_FOCUS_VISIBLE]:
    'has-[:focus-visible]:not-data-[dragging]:shadow-platform-focus-ring',
};

// An inset shadow, so it stacks with the element's own drop shadow instead of replacing it.
const INSET_FOCUS_RING_TRIGGER_CLASSES: Record<TFocusRingTrigger, string> = {
  [FOCUS_RING_TRIGGER.FOCUS_VISIBLE]:
    'focus-visible:outline-hidden focus-visible:inset-shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.HIGHLIGHTED]:
    'data-[highlighted]:inset-shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED]:
    'group-focus-visible:data-[highlighted]:inset-shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.INNER_FOCUS_VISIBLE]:
    'has-[:focus-visible]:not-data-[dragging]:inset-shadow-platform-focus-ring',
};

export const focusRingClasses = (
  ground: TFocusRingGround,
  trigger: TFocusRingTrigger = FOCUS_RING_TRIGGER.FOCUS_VISIBLE,
): string =>
  `${FOCUS_RING_TRIGGER_CLASSES[trigger]} ${FOCUS_RING_GROUND_CLASSES[ground]}`;

// For an element whose clipping parent would cut off a ring drawn outside it.
export const insetFocusRingClasses = (
  ground: TFocusRingGround,
  trigger: TFocusRingTrigger = FOCUS_RING_TRIGGER.FOCUS_VISIBLE,
): string =>
  `${INSET_FOCUS_RING_TRIGGER_CLASSES[trigger]} ${FOCUS_RING_GROUND_CLASSES[ground]}`;
