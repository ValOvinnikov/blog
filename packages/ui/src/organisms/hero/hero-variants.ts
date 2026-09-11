import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { AZURE_SCRIM, NEUTRAL_SCRIM, tv } from '@blog/ui/lib/styling';

export const heroVariants = tv({
  slots: {
    root: ['w-full'],
    grid: ['grid grid-cols-1 items-stretch gap-[clamp(1.25rem,4vw,2rem)]'],
    copy: ['flex h-full flex-col', 'min-w-0'],
    eyebrow: [],
    title: ['mt-2.5 mb-3'],
    heading: [],
    excerpt: ['m-0', 'max-w-[52ch]'],
    media: [],
    overlay: [],
  },
  variants: {
    variant: {
      [HERO_VARIANT.SPLIT]: {},
      [HERO_VARIANT.STACKED]: {},
      [HERO_VARIANT.BANNER]: {
        root: ['relative isolate overflow-hidden rounded-xl', 'min-h-[360px]'],
        grid: ['relative z-0 items-center', 'p-8 sm:p-10'],
        eyebrow: ['text-white'],
        heading: ['text-white'],
        excerpt: ['text-white/85'],
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
      [CONTENT_ALIGNMENT.CENTER]: { copy: ['text-center'] },
      [CONTENT_ALIGNMENT.RIGHT]: { copy: ['text-right'] },
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
