import {
  BRAND_VARIANT,
  CTA_ALIGNMENT,
  CTA_MOBILE_MEDIA_ORDER,
  CTA_VARIANT,
} from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

// Banner's overlay scrim — fixed oklch stops, independent of theme, so the
// same value applies in light and dark (unlike the card tokens below).
const AZURE_SCRIM =
  'bg-[linear-gradient(105deg,_oklch(0.2_0.06_250_/_0.92)_0%,_oklch(0.35_0.12_250_/_0.72)_55%,_oklch(0.45_0.14_250_/_0.4)_100%)]';
const NEUTRAL_SCRIM =
  'bg-[linear-gradient(105deg,_oklch(0.18_0.01_250_/_0.9)_0%,_oklch(0.26_0.015_250_/_0.68)_55%,_oklch(0.32_0.02_250_/_0.4)_100%)]';

export const ctaModuleVariants = tv({
  slots: {
    root: [
      'relative isolate flex flex-col',
      'mx-auto w-full max-w-4xl overflow-hidden',
      'rounded-xl border border-border shadow-card',
      'px-6 py-8 sm:px-8 sm:py-10',
    ],
    eyebrow: ['mb-3'],
    heading: ['m-0'],
    body: ['relative z-0 min-w-0'],
    text: [
      'mt-3 max-w-prose text-muted',
      '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
      '[&>*+*]:mt-2 [&_li+li]:mt-1',
      'marker:text-brand-primary',
    ],
    media: ['[&>*]:block [&>*]:h-full [&>*]:w-full [&>*]:object-cover'],
    overlay: ['pointer-events-none absolute inset-0 -z-10'],
    actions: ['mt-5 flex flex-wrap items-center gap-3'],
    footnote: ['mt-3.5 font-mono text-meta text-subtle'],
  },
  variants: {
    variant: {
      [CTA_VARIANT.BANNER]: {
        root: [
          'left-1/2 mx-0 w-screen max-w-none -translate-x-1/2',
          'rounded-none border-0 shadow-none',
          'min-h-[280px] justify-center px-7 py-12 sm:px-10',
        ],
        body: ['max-w-[46ch]'],
        heading: ['text-white'],
        eyebrow: ['text-white'],
        text: ['text-white/85', 'marker:text-white'],
        footnote: ['text-white/70'],
        media: ['absolute inset-0 -z-20 overflow-hidden'],
      },
      [CTA_VARIANT.SPLIT]: {
        root: [
          'grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center',
        ],
        media: [
          'aspect-video overflow-hidden rounded-lg border border-border bg-surface-2 sm:aspect-[4/3]',
        ],
      },
      [CTA_VARIANT.CALLOUT]: {
        media: [
          'order-first mx-auto mb-6 aspect-video w-full max-w-[420px] overflow-hidden rounded-lg border border-border bg-surface-2',
        ],
      },
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: {},
      [BRAND_VARIANT.SECONDARY]: {},
      [BRAND_VARIANT.BRAND_PRIMARY]: {},
    },
    position: {
      [CTA_ALIGNMENT.LEFT]: {},
      [CTA_ALIGNMENT.CENTER]: {},
      [CTA_ALIGNMENT.RIGHT]: {},
    },
    alignment: {
      [CTA_ALIGNMENT.LEFT]: {
        root: ['text-left'],
        actions: ['justify-start'],
      },
      [CTA_ALIGNMENT.CENTER]: {
        root: ['text-center'],
        actions: ['justify-center'],
      },
      [CTA_ALIGNMENT.RIGHT]: {
        root: ['text-right'],
        actions: ['justify-end'],
      },
    },
    mobileMediaOrder: {
      [CTA_MOBILE_MEDIA_ORDER.FIRST]: { media: ['order-first md:order-none'] },
      [CTA_MOBILE_MEDIA_ORDER.LAST]: {},
    },
    wrapped: {
      true: { root: ['mt-0'] },
    },
  },
  compoundVariants: [
    {
      variant: [CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT],
      tone: BRAND_VARIANT.PRIMARY,
      class: { root: ['bg-primary'] },
    },
    {
      variant: [CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT],
      tone: BRAND_VARIANT.SECONDARY,
      class: { root: ['bg-secondary'] },
    },
    {
      variant: [CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT],
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { root: ['bg-brand-primary-muted'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { overlay: [AZURE_SCRIM] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
      class: { overlay: [NEUTRAL_SCRIM] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CTA_ALIGNMENT.LEFT,
      class: { root: ['items-start'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CTA_ALIGNMENT.CENTER,
      class: { root: ['items-center'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CTA_ALIGNMENT.RIGHT,
      class: { root: ['items-end'] },
    },
    {
      variant: CTA_VARIANT.SPLIT,
      position: CTA_ALIGNMENT.RIGHT,
      class: { body: ['md:order-2'] },
    },
    // A centered Callout still reads lists left-aligned within the centered
    // block — a fully centered list separates markers from their text.
    {
      variant: CTA_VARIANT.CALLOUT,
      alignment: CTA_ALIGNMENT.CENTER,
      class: {
        text: [
          '[&_ul]:inline-block [&_ol]:inline-block [&_ul]:text-left [&_ol]:text-left',
        ],
      },
    },
  ],
  defaultVariants: {
    variant: CTA_VARIANT.CALLOUT,
  },
});

export type TCtaModuleVariants = VariantProps<typeof ctaModuleVariants>;
