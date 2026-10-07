import { BRAND_VARIANT, CONTENT_ALIGNMENT, SPACING_SCALE } from '@blog/config';

import { BAND_SPACING_BOTTOM, BAND_SPACING_TOP } from './band-spacing';
import { FULL_BLEED } from './full-bleed';
import {
  BRAND_SCRIM_CENTER,
  BRAND_SCRIM_LEFT_FROM_SM,
  BRAND_SCRIM_RIGHT_FROM_SM,
  NEUTRAL_SCRIM_CENTER,
  NEUTRAL_SCRIM_LEFT_FROM_SM,
  NEUTRAL_SCRIM_RIGHT_FROM_SM,
} from './scrims';
import { tv } from './tv';

const NEUTRAL_TONES = [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY];

/** The IMAGE_SCRIM surface: a full-bleed photo under a scrim, sized and padded by the band ladder. */
export const bannerVariants = tv({
  slots: {
    root: [
      ...FULL_BLEED,
      'isolate flex flex-col justify-center overflow-hidden rounded-none',
      'min-h-[calc(var(--banner-top)+var(--banner-bottom))] px-gutter',
    ],
    media: [
      'absolute inset-0 -z-20 overflow-hidden',
      '[&>*]:block [&>*]:h-full [&>*]:w-full [&>*]:object-cover',
    ],
    overlay: ['pointer-events-none absolute inset-0 -z-10'],
    copy: [],
    block: [],
    actions: [],
    title: ['text-on-image'],
    text: ['text-on-image-muted'],
  },
  variants: {
    tone: {
      [BRAND_VARIANT.PRIMARY]: {},
      [BRAND_VARIANT.SECONDARY]: {},
      [BRAND_VARIANT.BRAND_PRIMARY]: {},
    },
    position: {
      [CONTENT_ALIGNMENT.LEFT]: { root: ['items-center sm:items-start'] },
      [CONTENT_ALIGNMENT.CENTER]: { root: ['items-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { root: ['items-center sm:items-end'] },
    },
    // A banner keeps a gutter-sized floor at NONE so its copy never meets the photo's edge.
    spacingTop: {
      [SPACING_SCALE.NONE]: {
        root: ['pt-gutter', '[--banner-top:calc(var(--spacing-band)*6)]'],
      },
      [SPACING_SCALE.SM]: {
        root: [
          BAND_SPACING_TOP[SPACING_SCALE.SM],
          '[--banner-top:calc(var(--spacing-band-sm)*14/3)]',
        ],
      },
      [SPACING_SCALE.MD]: {
        root: [
          BAND_SPACING_TOP[SPACING_SCALE.MD],
          '[--banner-top:calc(var(--spacing-band-md)*10/3)]',
        ],
      },
      [SPACING_SCALE.LG]: {
        root: [
          BAND_SPACING_TOP[SPACING_SCALE.LG],
          '[--banner-top:calc(var(--spacing-band-lg)*13/4)]',
        ],
      },
      [SPACING_SCALE.XL]: {
        root: [
          BAND_SPACING_TOP[SPACING_SCALE.XL],
          '[--banner-top:calc(var(--spacing-band-xl)*3)]',
        ],
      },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: {
        root: ['pb-gutter', '[--banner-bottom:calc(var(--spacing-band)*6)]'],
      },
      [SPACING_SCALE.SM]: {
        root: [
          BAND_SPACING_BOTTOM[SPACING_SCALE.SM],
          '[--banner-bottom:calc(var(--spacing-band-sm)*14/3)]',
        ],
      },
      [SPACING_SCALE.MD]: {
        root: [
          BAND_SPACING_BOTTOM[SPACING_SCALE.MD],
          '[--banner-bottom:calc(var(--spacing-band-md)*10/3)]',
        ],
      },
      [SPACING_SCALE.LG]: {
        root: [
          BAND_SPACING_BOTTOM[SPACING_SCALE.LG],
          '[--banner-bottom:calc(var(--spacing-band-lg)*13/4)]',
        ],
      },
      [SPACING_SCALE.XL]: {
        root: [
          BAND_SPACING_BOTTOM[SPACING_SCALE.XL],
          '[--banner-bottom:calc(var(--spacing-band-xl)*3)]',
        ],
      },
    },
  },
  compoundVariants: [
    {
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.LEFT,
      class: { overlay: [BRAND_SCRIM_CENTER, BRAND_SCRIM_LEFT_FROM_SM] },
    },
    {
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.CENTER,
      class: { overlay: [BRAND_SCRIM_CENTER] },
    },
    {
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { overlay: [BRAND_SCRIM_CENTER, BRAND_SCRIM_RIGHT_FROM_SM] },
    },
    {
      tone: NEUTRAL_TONES,
      position: CONTENT_ALIGNMENT.LEFT,
      class: { overlay: [NEUTRAL_SCRIM_CENTER, NEUTRAL_SCRIM_LEFT_FROM_SM] },
    },
    {
      tone: NEUTRAL_TONES,
      position: CONTENT_ALIGNMENT.CENTER,
      class: { overlay: [NEUTRAL_SCRIM_CENTER] },
    },
    {
      tone: NEUTRAL_TONES,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { overlay: [NEUTRAL_SCRIM_CENTER, NEUTRAL_SCRIM_RIGHT_FROM_SM] },
    },
    {
      position: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
      class: {
        copy: ['max-sm:text-center'],
        block: ['max-sm:mx-auto'],
        actions: ['max-sm:justify-center'],
      },
    },
  ],
  defaultVariants: {
    tone: BRAND_VARIANT.PRIMARY,
    position: CONTENT_ALIGNMENT.LEFT,
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
  },
});
