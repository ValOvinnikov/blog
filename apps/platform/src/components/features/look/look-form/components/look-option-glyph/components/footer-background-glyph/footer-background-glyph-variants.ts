import { BRAND_VARIANT } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

// The swatch paints the site's own tokens, not `--platform-*` ones, so it shows the footer's real background.
export const footerBackgroundGlyphVariants = tv({
  slots: {
    swatch: [
      'flex h-5 w-8 shrink-0 items-end rounded-platform-3 border border-platform-control-line px-1 pb-1',
    ],
    line: ['block h-0.75 w-[60%] rounded-full bg-text-muted'],
  },
  variants: {
    background: {
      [BRAND_VARIANT.BRAND_PRIMARY]: { swatch: ['bg-brand-primary-muted'] },
      [BRAND_VARIANT.PRIMARY]: { swatch: ['bg-primary'] },
      [BRAND_VARIANT.SECONDARY]: { swatch: ['bg-secondary'] },
    },
  },
});
