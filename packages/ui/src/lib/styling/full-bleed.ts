// Centres on its parent, which must itself be viewport-centred. The breakout is viewport-wide, so the root clips the scrollbar gutter that `100vw` includes.
export const FULL_BLEED = [
  'relative left-1/2 w-screen max-w-none -translate-x-1/2',
  '[html:has(&)]:overflow-x-clip',
];

// Wider than this, a photo is upscaled past common source widths and `object-cover` crops it into a thin strip.
export const MEDIA_MAX_WIDTH = 'max-w-[1920px]';
