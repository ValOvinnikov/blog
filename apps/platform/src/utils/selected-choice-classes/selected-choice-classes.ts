// A picked choice's 1.5px border equals the 1px border plus 0.5px margin of an unpicked one, so its outer size never moves.
export const SELECTED_CHOICE_CLASSES = [
  'border-[1.5px] border-platform-selected-line bg-platform-selected-tint shadow-platform-choice-ring',
];

export const SELECTED_COMPACT_FILL_CLASSES =
  'border-platform-selected-edge bg-platform-selected text-platform-on-selected';

export const SELECTED_COMPACT_CHOICE_CLASSES = [
  'border-[1.5px]',
  SELECTED_COMPACT_FILL_CLASSES,
];

export const UNSELECTED_CHOICE_CLASSES = ['m-[0.5px] border'];

export const SELECTED_TICK_CLASSES =
  'flex size-4 items-center justify-center rounded-full bg-platform-selected text-platform-on-selected';

// The edge is a pseudo-element so it paints above the row's inset focus ring.
export const SELECTED_ROW_CLASSES = [
  'relative bg-platform-selected-tint',
  'before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-platform-bar before:rounded-l-[inherit] before:bg-platform-selected-line',
  'after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-platform-selected-edge',
];
