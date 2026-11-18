import { FOCUS_RING, TRANSITION_COLORS } from './interaction';

/** The hover, keyboard-focus and current-page look every nested menu row shares. */
export const MENU_ROW = [
  'rounded-md',
  TRANSITION_COLORS,
  'hover:bg-brand-primary-muted hover:text-brand-primary',
  'focus-visible:bg-brand-primary-muted focus-visible:text-brand-primary',
  'aria-[current=page]:bg-brand-primary-muted aria-[current=page]:font-semibold aria-[current=page]:text-brand-primary',
  FOCUS_RING,
  'forced-colors:hover:outline-1 forced-colors:hover:outline-solid forced-colors:hover:outline-[CanvasText] forced-colors:hover:-outline-offset-1',
];
