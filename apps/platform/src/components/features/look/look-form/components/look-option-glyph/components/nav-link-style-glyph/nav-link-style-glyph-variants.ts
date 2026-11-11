import { NAV_LINK_STYLE } from '@blog/config';
import { tv } from '@platform/utils/tv/tv';

export const navLinkStyleGlyphVariants = tv({
  base: [
    'inline-flex h-5 items-center px-1.5 text-admin-11 leading-none font-medium',
  ],
  variants: {
    linkStyle: {
      [NAV_LINK_STYLE.PLAIN]: [],
      [NAV_LINK_STYLE.UNDERLINE]: [
        'underline decoration-[1.5px] underline-offset-[3px]',
      ],
      [NAV_LINK_STYLE.SOFT]: ['rounded-admin-3 bg-admin-pill-neutral'],
      [NAV_LINK_STYLE.PILL]: ['rounded-full border border-current'],
    },
  },
});
