// 0.4em clears descenders with the 2px hover line too, yet stays above the next line's ascenders at the tightest body leading (1.55).
// The 0.3em bottom padding stretches the box, and so the focus ring, past the underline instead of across it.
const UNDERLINE =
  'underline underline-offset-[0.4em] [text-decoration-skip-ink:auto] pb-[0.3em]';

export const LINK_UNDERLINE_AT_REST = [UNDERLINE, 'decoration-1'];

export const LINK_UNDERLINE = [...LINK_UNDERLINE_AT_REST, 'hover:decoration-2'];

export const LINK_UNDERLINE_EMPHASIS = [UNDERLINE, 'decoration-2'];
