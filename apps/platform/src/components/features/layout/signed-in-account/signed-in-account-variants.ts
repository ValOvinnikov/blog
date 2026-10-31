import { SIZE } from '@blog/config';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { tv } from '@platform/utils/tv/tv';

export const signedInAccountVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center justify-between gap-x-3 gap-y-2'],
    email: ['min-w-0 text-admin-12 [overflow-wrap:anywhere]'],
    signOut: [],
  },
  variants: {
    surface: {
      card: {},
      rail: {
        email: ['hidden text-admin-side-muted md:block'],
        signOut: [
          'text-admin-side-text hover:bg-admin-side-raised hover:text-white',
          // Keeps the 44px tap target from growing the 26px brand row of the phone band.
          '-my-[9px] md:my-0',
        ],
      },
      railFooter: {
        email: ['text-admin-side-text'],
        signOut: [
          'text-admin-side-text hover:bg-admin-side-raised hover:text-white',
        ],
      },
    },
  },
  defaultVariants: { surface: 'card' },
});

export const SIGN_OUT_BUTTON_BY_SURFACE = {
  card: { variant: BUTTON_VARIANT.GHOST, size: SIZE.SM },
  rail: { variant: BUTTON_VARIANT.GHOST, size: SIZE.SM },
  railFooter: { variant: BUTTON_VARIANT.GHOST, size: SIZE.SM },
} as const;
