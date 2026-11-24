import { tv } from '@platform/utils/tv/tv';

// The swatch paints the site's own tokens, not `--platform-*` ones, so it shows the skin's real ground.
export const skinSwatchGlyphVariants = tv({
  slots: {
    swatch: [
      'flex h-5 w-8 shrink-0 items-end rounded-platform-3 border border-platform-control-line bg-ambient px-1 pb-1',
      '[[aria-disabled=true]:not([data-pressed])_&]:opacity-(--platform-locked-fade)',
    ],
    line: ['block h-0.75 w-[60%] rounded-full bg-text-muted'],
  },
});
