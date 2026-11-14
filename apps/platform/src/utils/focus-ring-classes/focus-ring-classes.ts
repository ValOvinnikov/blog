import {
  FOCUS_RING_GROUND,
  FOCUS_RING_TRIGGER,
  type TCheckedFocusRingGround,
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
  [FOCUS_RING_GROUND.SEGMENT_ON]:
    '[--platform-focus-ground:var(--platform-segment-on)]',
  [FOCUS_RING_GROUND.HOVER_TINT]:
    '[--platform-focus-ground:var(--platform-hover-tint)]',
  [FOCUS_RING_GROUND.THEME_TRACK]:
    '[--platform-focus-ground:var(--platform-theme-track)]',
  [FOCUS_RING_GROUND.BRAND_WEAK]:
    '[--platform-focus-ground:var(--platform-brand-weak)]',
};

const CHECKED_FOCUS_RING_GROUND_CLASSES: Record<
  TCheckedFocusRingGround,
  string
> = {
  [FOCUS_RING_GROUND.SEGMENT_ON]:
    'data-[checked]:[--platform-focus-ground:var(--platform-segment-on)]',
};

// Forced colours drop box-shadows; the theme's `:focus-visible` outline covers only the default trigger.
const FOCUS_RING_TRIGGER_CLASSES: Record<TFocusRingTrigger, string> = {
  [FOCUS_RING_TRIGGER.FOCUS_VISIBLE]:
    'focus-visible:outline-hidden focus-visible:shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED]:
    'group-focus-visible:data-[highlighted]:shadow-platform-focus-ring forced-colors:group-focus-visible:data-[highlighted]:outline-2 forced-colors:group-focus-visible:data-[highlighted]:outline-offset-2 forced-colors:group-focus-visible:data-[highlighted]:outline-[Highlight]',
  [FOCUS_RING_TRIGGER.INNER_FOCUS_VISIBLE]:
    'has-[:focus-visible]:not-data-[dragging]:shadow-platform-focus-ring forced-colors:has-[:focus-visible]:outline-2 forced-colors:has-[:focus-visible]:outline-offset-2 forced-colors:has-[:focus-visible]:outline-[Highlight]',
};

// An inset shadow, so it stacks with the element's own drop shadow instead of replacing it.
const INSET_FOCUS_RING_TRIGGER_CLASSES: Record<TFocusRingTrigger, string> = {
  [FOCUS_RING_TRIGGER.FOCUS_VISIBLE]:
    'focus-visible:outline-hidden focus-visible:inset-shadow-platform-focus-ring',
  [FOCUS_RING_TRIGGER.LIST_HIGHLIGHTED]:
    'group-focus-visible:data-[highlighted]:inset-shadow-platform-focus-ring forced-colors:group-focus-visible:data-[highlighted]:outline-2 forced-colors:group-focus-visible:data-[highlighted]:-outline-offset-2 forced-colors:group-focus-visible:data-[highlighted]:outline-[Highlight]',
  [FOCUS_RING_TRIGGER.INNER_FOCUS_VISIBLE]:
    'has-[:focus-visible]:not-data-[dragging]:inset-shadow-platform-focus-ring forced-colors:has-[:focus-visible]:outline-2 forced-colors:has-[:focus-visible]:-outline-offset-2 forced-colors:has-[:focus-visible]:outline-[Highlight]',
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

export const checkedFocusRingGroundClasses = (
  ground: TCheckedFocusRingGround,
): string => CHECKED_FOCUS_RING_GROUND_CLASSES[ground];
