// An em offset clears descenders at every font size, where a fixed 2px runs through them.
const UNDERLINE =
  'underline underline-offset-[0.2em] [text-decoration-skip-ink:auto]';

export const LINK_UNDERLINE = [UNDERLINE, 'decoration-1 hover:decoration-2'];

export const LINK_UNDERLINE_EMPHASIS = [UNDERLINE, 'decoration-2'];
