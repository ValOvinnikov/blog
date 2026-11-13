import { SIZE } from '@blog/config';
import { SPINNER_TONE } from '@platform/constants/spinner';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

const HALF = [
  'absolute top-1/2 left-1/2 h-[32%] w-[64%] -translate-x-1/2 border-solid',
  'motion-reduce:animate-none',
];

export const spinnerVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-2', 'text-admin-muted'],
    glyph: ['relative inline-block shrink-0 -rotate-45'],
    orbit: [
      'absolute inset-0',
      'animate-admin-spinner-orbit motion-reduce:animate-none',
    ],
    unlit: [
      ...HALF,
      'rounded-[0_0_50%_50%/0_0_100%_100%]',
      'animate-admin-spinner-unlit',
    ],
    lit: [
      ...HALF,
      '-translate-y-full border-0 rounded-[50%_50%_0_0/100%_100%_0_0]',
      'animate-admin-spinner-lit',
    ],
    text: ['text-admin-14'],
  },
  variants: {
    size: {
      [SIZE.SM]: { glyph: ['size-3.5'], unlit: ['border'] },
      [SIZE.MD]: { glyph: ['size-4.5'], unlit: ['border-[1.25px]'] },
      [SIZE.LG]: { glyph: ['size-6'], unlit: ['border-[1.5px]'] },
    },
    tone: {
      [SPINNER_TONE.BRAND]: {
        unlit: ['border-admin-logo-ink bg-admin-logo-ink'],
        lit: ['bg-admin-highlight'],
      },
      [SPINNER_TONE.TEXT]: {
        unlit: ['border-current bg-transparent'],
        lit: ['bg-current'],
      },
      [SPINNER_TONE.ON_BRAND]: {
        unlit: [
          'border-admin-spinner-on-brand-line bg-admin-spinner-on-brand-unlit',
        ],
        lit: ['bg-admin-spinner-on-brand-lit'],
      },
    },
  },
  defaultVariants: {
    size: SIZE.MD,
    tone: SPINNER_TONE.BRAND,
  },
});

export type TSpinnerVariants = VariantProps<typeof spinnerVariants>;
