import { TRANSITION_COLORS } from './interaction';

export const INTERACTIVE_ITEM_CARD = [
  'group relative',
  'hover:bg-item-hover focus-within:bg-item-hover',
  'hover:outline focus-within:outline -outline-offset-1 outline-[color:var(--item-hover-edge,transparent)]',
  TRANSITION_COLORS,
  'motion-reduce:transition-none',
];
