import { BUSY_BUTTON_STYLE, SIZE } from '@blog/config';
import {
  FOCUS_RING,
  LINK_UNDERLINE,
  TRANSITION_COLORS,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const buttonVariants = tv({
  base: [
    'inline-flex min-h-9 items-center justify-center',
    'rounded-sm border',
    'font-display font-medium',
    TRANSITION_COLORS,
    'relative cursor-pointer aria-busy:cursor-progress',
    FOCUS_RING,
    'disabled:pointer-events-none disabled:opacity-50',
  ],
  variants: {
    variant: {
      primary:
        'border-transparent bg-brand-primary-solid text-brand-primary-contrast hover:bg-brand-primary-solid-hover',
      ghost:
        'border-border-strong bg-transparent text-text hover:border-brand-primary hover:text-brand-primary',
      // Forced colours paint transparent borders, so the link drops its border there.
      link: 'border-transparent bg-transparent text-brand-primary hover:text-brand-primary-hover forced-colors:border-0',
      danger:
        'border-error/55 bg-transparent text-error hover:border-error hover:bg-error hover:text-primary',
    },
    size: {
      [SIZE.SM]: 'px-3 py-1.5 text-sm',
      [SIZE.MD]: 'px-4 py-2 text-copy',
      [SIZE.LG]: 'px-5 py-2.5 text-base',
    },
  },
  compoundVariants: [
    {
      variant: 'link',
      size: [SIZE.SM, SIZE.MD, SIZE.LG],
      class: ['min-h-6 px-0 py-0', ...LINK_UNDERLINE],
    },
  ],
  defaultVariants: { variant: 'primary', size: SIZE.MD },
});

export type TButtonVariants = VariantProps<typeof buttonVariants>;

const FACE = [
  'col-start-1 row-start-1',
  'inline-flex items-center justify-center gap-[0.6ch]',
];

export const buttonBusyVariants = tv({
  slots: {
    faces: ['grid'],
    idleFace: FACE,
    keptFace: FACE,
    busyFace: FACE,
    edge: [
      'pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]',
      'before:absolute before:bottom-0 before:left-0 before:h-0.5 before:w-1/3 before:bg-current',
      'before:animate-[busy-edge_1.2s_ease-in-out_infinite]',
      'motion-reduce:before:w-full motion-reduce:before:animate-none',
    ],
    status: ['sr-only'],
  },
  variants: {
    busyStyle: {
      [BUSY_BUTTON_STYLE.LABEL]: {},
      [BUSY_BUTTON_STYLE.KEPT]: {},
      [BUSY_BUTTON_STYLE.EDGE]: {},
    },
    isBusy: {
      true: {},
      false: { keptFace: ['invisible'], busyFace: ['invisible'] },
    },
  },
  compoundVariants: [
    {
      isBusy: true,
      busyStyle: [BUSY_BUTTON_STYLE.LABEL, BUSY_BUTTON_STYLE.EDGE],
      class: { idleFace: ['invisible'], keptFace: ['invisible'] },
    },
    {
      isBusy: true,
      busyStyle: BUSY_BUTTON_STYLE.KEPT,
      class: {
        idleFace: ['invisible'],
        keptFace: ['motion-reduce:invisible'],
        busyFace: ['invisible motion-reduce:visible'],
      },
    },
  ],
  defaultVariants: { busyStyle: BUSY_BUTTON_STYLE.LABEL, isBusy: false },
});

export type TButtonBusyVariants = VariantProps<typeof buttonBusyVariants>;
