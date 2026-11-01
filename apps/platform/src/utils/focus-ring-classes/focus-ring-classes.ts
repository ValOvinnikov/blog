import {
  FOCUS_RING_GROUND,
  type TFocusRingGround,
} from '@platform/constants/focus-ring';

// Whole literals per ground: Tailwind only generates classes it finds spelled out in source.
const FOCUS_RING_SHADOW_CLASSES: Record<TFocusRingGround, string> = {
  [FOCUS_RING_GROUND.SIDE]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-side),0_0_0_4px_var(--admin-side-accent)]',
  [FOCUS_RING_GROUND.BG]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-bg),0_0_0_4px_var(--admin-brand-ink)]',
  [FOCUS_RING_GROUND.SURFACE]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-surface),0_0_0_4px_var(--admin-brand-ink)]',
  [FOCUS_RING_GROUND.SURFACE_HEAD]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-surface-head),0_0_0_4px_var(--admin-brand-ink)]',
  [FOCUS_RING_GROUND.POPOVER]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-popover),0_0_0_4px_var(--admin-brand-ink)]',
  [FOCUS_RING_GROUND.THEME_TRACK]:
    'focus-visible:shadow-[0_0_0_2px_var(--admin-theme-track),0_0_0_4px_var(--admin-brand-ink)]',
};

export const focusRingClasses = (ground: TFocusRingGround): string =>
  `focus-visible:outline-hidden ${FOCUS_RING_SHADOW_CLASSES[ground]}`;

export const SURFACE_EDITABLE_SHELL_FOCUS_RING_CLASSES =
  'has-[[contenteditable]:focus-visible]:shadow-[0_0_0_2px_var(--admin-surface),0_0_0_4px_var(--admin-brand-ink)]';
