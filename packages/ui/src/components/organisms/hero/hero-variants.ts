import { CONTENT_ALIGNMENT, HERO_VARIANT, MEDIA_ORDER } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';

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
  },
  variants: {
    variant: {
      [HERO_VARIANT.SPLIT]: {},
      [HERO_VARIANT.STACKED]: {},
      [HERO_VARIANT.BANNER]: {
        grid: ['items-center'],
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
      class: { media: ['w-full'] },
    },
    {
      variant: HERO_VARIANT.STACKED,
      mediaOrder: MEDIA_ORDER.FIRST,
      class: { media: ['order-first'] },
    },
  ],
});
