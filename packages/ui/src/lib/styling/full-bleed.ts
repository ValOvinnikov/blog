// The breakout is viewport-wide, so the root clips the scrollbar gutter that `100vw` includes.
export const FULL_BLEED = [
  'relative left-1/2 w-screen max-w-none -translate-x-1/2',
  '[html:has(&)]:overflow-x-clip',
];
