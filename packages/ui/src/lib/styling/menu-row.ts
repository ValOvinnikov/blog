import { FOCUS_RING, TRANSITION_COLORS } from './interaction';

/** The hover, keyboard-focus and current-page look every nested menu row shares. */
export const MENU_ROW = [
  'rounded-md',
  TRANSITION_COLORS,
  'hover:bg-tint hover:text-brand-primary',
  'focus-visible:bg-tint focus-visible:text-brand-primary',
  'aria-[current=page]:bg-tint aria-[current=page]:font-semibold aria-[current=page]:text-brand-primary',
  FOCUS_RING,
  'forced-colors:hover:outline-1 forced-colors:hover:outline-solid forced-colors:hover:outline-[CanvasText] forced-colors:hover:-outline-offset-1',
];
