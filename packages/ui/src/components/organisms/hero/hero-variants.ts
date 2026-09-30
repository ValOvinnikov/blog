import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
  SPACING_SCALE,
} from '@blog/config';
import { AZURE_SCRIM, NEUTRAL_SCRIM, tv } from '@blog/ui/lib/styling';

export const heroVariants = tv({
  slots: {
    root: ['w-full'],
    grid: ['grid grid-cols-1 items-stretch gap-[clamp(1.25rem,4vw,2rem)]'],
    copy: ['flex h-full flex-col', 'min-w-0'],
    eyebrow: ['font-semibold'],
    group: ['flex flex-col', 'max-w-measure', 'text-prose'],
    title: ['mt-2.5 mb-3'],
    heading: [],
    excerpt: ['m-0 font-medium text-text'],
    body: ['font-medium text-text'],
    media: [],
    overlay: [],
  },
  variants: {
    variant: {
      [HERO_VARIANT.SPLIT]: {},
      [HERO_VARIANT.STACKED]: {},
      [HERO_VARIANT.BANNER]: {
        root: [
          'relative isolate flex flex-col justify-center overflow-hidden',
          'left-1/2 w-screen max-w-none -translate-x-1/2 rounded-none',
          'min-h-[360px]',
          'px-8 pt-8 pb-8 sm:px-10 sm:pt-10 sm:pb-10',
        ],
        grid: ['items-center'],
        eyebrow: ['text-white'],
        heading: ['text-white'],
        excerpt: ['text-white'],
        body: ['text-white'],
      },
    },
    hasMedia: {
      true: {},
    },
    position: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: {},
      [CONTENT_ALIGNMENT.RIGHT]: {},
    },
    alignment: {
      [CONTENT_ALIGNMENT.LEFT]: { copy: ['text-left'] },
      [CONTENT_ALIGNMENT.CENTER]: {
        copy: ['text-center'],
        group: ['mx-auto'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: { copy: ['text-right'], group: ['ml-auto'] },
    },
    mediaOrder: {
      [MEDIA_ORDER.FIRST]: {},
      [MEDIA_ORDER.LAST]: {},
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: {},
      [BRAND_VARIANT.SECONDARY]: {},
      [BRAND_VARIANT.BRAND_PRIMARY]: {},
    },
    spacingTop: {
      [SPACING_SCALE.NONE]: { root: ['pt-6 sm:pt-6'] },
      [SPACING_SCALE.SM]: { root: ['pt-7 sm:pt-8'] },
      [SPACING_SCALE.MD]: { root: ['pt-8 sm:pt-10'] },
      [SPACING_SCALE.LG]: { root: ['pt-12 sm:pt-16'] },
      [SPACING_SCALE.XL]: { root: ['pt-16 sm:pt-24'] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: { root: ['pb-6 sm:pb-6'] },
      [SPACING_SCALE.SM]: { root: ['pb-7 sm:pb-8'] },
      [SPACING_SCALE.MD]: { root: ['pb-8 sm:pb-10'] },
      [SPACING_SCALE.LG]: { root: ['pb-12 sm:pb-16'] },
      [SPACING_SCALE.XL]: { root: ['pb-16 sm:pb-24'] },
    },
  },
  compoundVariants: [
    {
      variant: HERO_VARIANT.SPLIT,
      hasMedia: true,
      class: {
        grid: ['lg:grid-cols-[minmax(0,1.15fr)_minmax(180px,0.85fr)]'],
      },
    },
    {
      variant: HERO_VARIANT.SPLIT,
      hasMedia: true,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: {
        grid: ['lg:grid-cols-[minmax(180px,0.85fr)_minmax(0,1.15fr)]'],
      },
    },
    {
      variant: HERO_VARIANT.SPLIT,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { copy: ['lg:order-2'] },
    },
    {
      variant: HERO_VARIANT.SPLIT,
      mediaOrder: MEDIA_ORDER.FIRST,
      class: { media: ['order-first lg:order-none'] },
    },
    {
      variant: HERO_VARIANT.STACKED,
      mediaOrder: MEDIA_ORDER.FIRST,
      class: { media: ['order-first'] },
    },
    {
      variant: HERO_VARIANT.BANNER,
      class: {
        media: [
          'absolute inset-0 -z-20',
          '[&>*]:block [&>*]:h-full [&>*]:w-full [&>*]:object-cover',
        ],
        overlay: ['pointer-events-none absolute inset-0 -z-10'],
      },
    },
    {
      variant: HERO_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.LEFT,
      class: { grid: ['justify-items-start'] },
    },
    {
      variant: HERO_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.CENTER,
      class: { grid: ['justify-items-center'] },
    },
    {
      variant: HERO_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { grid: ['justify-items-end'] },
    },
    {
      variant: HERO_VARIANT.BANNER,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { overlay: [AZURE_SCRIM] },
    },
    {
      variant: HERO_VARIANT.BANNER,
      tone: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
      class: { overlay: [NEUTRAL_SCRIM] },
    },
  ],
  defaultVariants: {
    tone: BRAND_VARIANT.PRIMARY,
  },
});
