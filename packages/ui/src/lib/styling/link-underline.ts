// 0.4em clears descenders under the 2px hover line yet stays above the next line's ascenders at body leading.
const UNDERLINE =
  'underline underline-offset-[0.4em] [text-decoration-skip-ink:auto] pb-[0.3em]';

export const LINK_UNDERLINE_AT_REST = [UNDERLINE, 'decoration-1'];

export const LINK_UNDERLINE = [...LINK_UNDERLINE_AT_REST, 'hover:decoration-2'];

export const LINK_UNDERLINE_EMPHASIS = [UNDERLINE, 'decoration-2'];

export const STANDALONE_LINK_HOVER_UNDERLINE = [
  'underline-offset-[0.3em] [text-decoration-skip-ink:auto]',
  'hover:underline hover:decoration-standalone-link-underline hover:decoration-(length:--link-underline-width)',
];

export const DESCENDANT_LINKS_HOVER_UNDERLINE = [
  '[&_a]:underline-offset-[0.3em] [&_a]:[text-decoration-skip-ink:auto]',
  '[&_a:hover]:underline [&_a:hover]:decoration-standalone-link-underline [&_a:hover]:decoration-(length:--link-underline-width)',
];
