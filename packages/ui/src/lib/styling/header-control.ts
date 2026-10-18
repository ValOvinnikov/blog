import { FOCUS_RING, TRANSITION_COLORS } from './interaction';

export const HEADER_CONTROL_FRAME =
  'rounded-full border border-header-control bg-header-control-fill';

export const HEADER_CONTROL = [
  HEADER_CONTROL_FRAME,
  'text-text',
  TRANSITION_COLORS,
  'hover:border-brand-primary hover:bg-header-control-fill hover:text-brand-primary',
  'aria-expanded:border-brand-primary aria-expanded:text-brand-primary',
  'focus-visible:bg-header-control-fill',
  FOCUS_RING,
  'forced-colors:hover:outline-2 forced-colors:hover:outline-solid forced-colors:hover:outline-[Highlight]',
  'forced-colors:aria-expanded:outline-2 forced-colors:aria-expanded:outline-solid forced-colors:aria-expanded:outline-[Highlight]',
].join(' ');
