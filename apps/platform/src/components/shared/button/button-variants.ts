import { SIZE } from '@blog/config';
import { TEXT_LINK_COLOUR_CLASSES } from '@platform/components/shared/text-link/text-link-variants';
import {
  BUTTON_VARIANT,
  type TButtonVariant,
} from '@platform/constants/button';
import {
  FOCUS_RING_GROUND,
  type TFocusRingGround,
} from '@platform/constants/focus-ring';
import { focusRingClasses } from '@platform/utils/focus-ring-classes/focus-ring-classes';
import { tv } from '@platform/utils/tv/tv';
import type { VariantProps } from 'tailwind-variants';

const STYLED_VARIANTS: Exclude<
  TButtonVariant,
  typeof BUTTON_VARIANT.UNSTYLED | typeof BUTTON_VARIANT.LINK
>[] = [
  BUTTON_VARIANT.PRIMARY,
  BUTTON_VARIANT.SECONDARY,
  BUTTON_VARIANT.GHOST,
  BUTTON_VARIANT.DANGER,
];

const FOCUS_GROUNDS = [
  FOCUS_RING_GROUND.BG,
  FOCUS_RING_GROUND.SURFACE,
  FOCUS_RING_GROUND.SURFACE_HEAD,
] as const satisfies TFocusRingGround[];

const FACE = [
  'col-start-1 row-start-1 inline-flex items-center justify-center gap-[7px]',
];

export const buttonVariants = tv({
  slots: {
    root: [],
    faces: [],
    idleFace: [],
    busyFace: [],
    busyGlyph: ['text-current'],
    srOnlyStatus: ['sr-only'],
  },
  variants: {
    variant: {
      [BUTTON_VARIANT.PRIMARY]: {
        root: ['border-admin-brand bg-admin-brand text-white shadow-admin'],
      },
      [BUTTON_VARIANT.SECONDARY]: {
        root: [
          'border-admin-control-line bg-admin-surface text-admin-text shadow-admin hover:border-admin-brand-ink',
        ],
      },
      [BUTTON_VARIANT.GHOST]: {
        root: [
          'border-transparent bg-transparent text-admin-text hover:bg-admin-hover',
        ],
      },
      [BUTTON_VARIANT.DANGER]: {
        root: [
          'border-admin-bad-line bg-admin-bad-weak text-admin-bad shadow-admin',
        ],
      },
      [BUTTON_VARIANT.UNSTYLED]: {
        root: [],
      },
      [BUTTON_VARIANT.LINK]: {
        root: [
          'inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center md:min-h-9 md:min-w-9',
          'rounded-admin-control border-0 bg-transparent px-1 py-0',
          'text-admin-13-5 leading-5 font-semibold no-underline',
          TEXT_LINK_COLOUR_CLASSES,
          'hover:text-admin-brand-hover',
        ],
      },
    },
    size: {
      [SIZE.XS]: {},
      [SIZE.SM]: {},
      [SIZE.MD]: {},
      [SIZE.LG]: {},
    },
    focusGround: {
      [FOCUS_RING_GROUND.BG]: {},
      [FOCUS_RING_GROUND.SURFACE]: {},
      [FOCUS_RING_GROUND.SURFACE_HEAD]: {},
    },
    isPending: {
      true: { idleFace: ['invisible'] },
      false: { busyFace: ['invisible'] },
    },
  },
  compoundVariants: [
    ...FOCUS_GROUNDS.map((focusGround) => ({
      variant: [...STYLED_VARIANTS, BUTTON_VARIANT.LINK],
      focusGround,
      class: { root: [focusRingClasses(focusGround)] },
    })),
    {
      variant: STYLED_VARIANTS,
      class: {
        root: [
          'inline-flex items-center gap-[7px]',
          'rounded-admin-control border font-medium no-underline',
          'cursor-pointer aria-busy:cursor-progress',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-[.45]',
          'aria-disabled:not-aria-busy:cursor-not-allowed aria-disabled:not-aria-busy:opacity-[.45]',
        ],
        faces: ['grid'],
        idleFace: FACE,
        busyFace: FACE,
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.XS,
      class: {
        root: [
          'h-11 min-w-16 justify-center px-[14px] py-0 text-admin-13-5 leading-4 font-semibold shadow-none',
          'md:h-7 md:min-w-0 md:px-[10px] md:text-admin-12-5',
        ],
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.SM,
      class: {
        root: ['min-h-11 px-[9px] py-[5px] text-admin-12 md:min-h-0'],
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.MD,
      class: {
        root: ['min-h-11 px-[13px] py-[8px] text-admin-13 md:min-h-0'],
      },
    },
    {
      variant: STYLED_VARIANTS,
      size: SIZE.LG,
      class: {
        root: [
          'h-11 justify-center px-5 text-admin-14 font-semibold shadow-none md:h-10',
        ],
      },
    },
    {
      variant: BUTTON_VARIANT.GHOST,
      class: {
        root: ['gap-[6px]'],
        idleFace: ['gap-[6px]'],
        busyFace: ['gap-[6px]'],
      },
    },
    {
      variant: BUTTON_VARIANT.GHOST,
      size: SIZE.SM,
      class: { root: ['px-[10px] py-0 md:px-[9px] md:py-[5px]'] },
    },
    {
      variant: BUTTON_VARIANT.SECONDARY,
      size: SIZE.LG,
      class: { root: ['px-[18px]'] },
    },
    {
      variant: BUTTON_VARIANT.SECONDARY,
      class: {
        root: [
          'disabled:border-admin-control-line-locked disabled:text-admin-muted disabled:opacity-100',
          'aria-disabled:not-aria-busy:border-admin-control-line-locked aria-disabled:not-aria-busy:text-admin-muted aria-disabled:not-aria-busy:opacity-100',
        ],
      },
    },
  ],
  defaultVariants: {
    variant: BUTTON_VARIANT.SECONDARY,
    size: SIZE.MD,
    focusGround: FOCUS_RING_GROUND.SURFACE,
    isPending: false,
  },
});

export type TButtonVariants = VariantProps<typeof buttonVariants>;
