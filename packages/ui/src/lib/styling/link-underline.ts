// 0.4em clears descenders with the 2px hover line too, yet stays above the next line's ascenders at the tightest body leading (1.55).
const UNDERLINE =
  'underline underline-offset-[0.4em] [text-decoration-skip-ink:auto]';

export const LINK_UNDERLINE = [UNDERLINE, 'decoration-1 hover:decoration-2'];

export const LINK_UNDERLINE_EMPHASIS = [UNDERLINE, 'decoration-2'];
