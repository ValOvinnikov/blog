import { SIZE } from '@blog/config';
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
        email: ['hidden text-admin-side-muted lg:block'],
        signOut: [
          'text-admin-side-text hover:bg-admin-side-raised hover:text-white',
          // Keeps the 44px tap target from growing the 26px brand row of the phone band.
          '-my-[9px] lg:my-0',
        ],
      },
    },
  },
  defaultVariants: { surface: 'card' },
});

export const SIGN_OUT_BUTTON_BY_SURFACE = {
  card: { variant: 'secondary', size: SIZE.MD },
  rail: { variant: 'ghost', size: SIZE.SM },
} as const;
