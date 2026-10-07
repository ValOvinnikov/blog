import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  MEDIA_ORDER,
  SPACING_SCALE,
} from '@blog/config';
import {
  AZURE_SCRIM_CENTER,
  AZURE_SCRIM_CENTER_BELOW_SM,
  AZURE_SCRIM_LEFT_FROM_SM,
  AZURE_SCRIM_RIGHT_FROM_SM,
  NEUTRAL_SCRIM_CENTER,
  NEUTRAL_SCRIM_CENTER_BELOW_SM,
  NEUTRAL_SCRIM_LEFT_FROM_SM,
  NEUTRAL_SCRIM_RIGHT_FROM_SM,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const ctaModuleVariants = tv({
  slots: {
    root: [
      'relative isolate flex flex-col',
      'mx-auto w-full max-w-4xl overflow-hidden',
      'rounded-card border border-border shadow-card',
      'px-6 pt-8 pb-8 sm:px-8 sm:pt-10 sm:pb-10',
    ],
    eyebrow: ['mb-3'],
    group: ['max-w-measure', 'text-prose'],
    heading: ['m-0'],
    body: ['relative z-0 min-w-0'],
    text: [
      'mt-3 text-muted',
      '[&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5',
      '[&>*+*]:mt-2 [&_li+li]:mt-1',
      'marker:text-current',
    ],
    media: ['[&>*]:block [&>*]:h-full [&>*]:w-full [&>*]:object-cover'],
    overlay: ['pointer-events-none absolute inset-0 -z-10'],
    actions: ['mt-5 flex flex-wrap items-center gap-3'],
    footnote: ['mt-3.5 max-w-measure font-mono text-caption text-subtle'],
  },
  variants: {
    variant: {
      [CTA_VARIANT.BANNER]: {
        root: [
          'left-1/2 mx-0 w-screen max-w-none -translate-x-1/2',
          'rounded-none border-0 shadow-none',
          'min-h-[calc(var(--banner-top)+var(--banner-bottom))] justify-center px-7 sm:px-10',
        ],
        body: ['max-w-measure', 'text-prose'],
        heading: ['text-white'],
        eyebrow: ['text-white'],
        text: ['text-white/85'],
        footnote: ['text-white/70'],
        media: ['absolute inset-0 -z-20 overflow-hidden'],
      },
      [CTA_VARIANT.SPLIT]: {
        root: [
          'grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center',
        ],
        media: [
          'aspect-video overflow-hidden rounded-media border border-border bg-surface-2 surface-nested sm:aspect-[4/3]',
        ],
      },
      [CTA_VARIANT.CALLOUT]: {
        media: [
          'order-first mx-auto mb-6 aspect-video w-full max-w-[420px] overflow-hidden rounded-media border border-border bg-surface-2 surface-nested',
        ],
      },
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: {},
      [BRAND_VARIANT.SECONDARY]: {},
      [BRAND_VARIANT.BRAND_PRIMARY]: {},
    },
    position: {
      [CONTENT_ALIGNMENT.LEFT]: {},
      [CONTENT_ALIGNMENT.CENTER]: {},
      [CONTENT_ALIGNMENT.RIGHT]: {},
    },
    alignment: {
      [CONTENT_ALIGNMENT.LEFT]: {
        root: ['text-left'],
        actions: ['justify-start'],
      },
      [CONTENT_ALIGNMENT.CENTER]: {
        root: ['text-center'],
        group: ['mx-auto'],
        footnote: ['mx-auto'],
        actions: ['justify-center'],
      },
      [CONTENT_ALIGNMENT.RIGHT]: {
        root: ['text-right'],
        group: ['ml-auto'],
        footnote: ['ml-auto'],
        actions: ['justify-end'],
      },
    },
    mobileMediaOrder: {
      [MEDIA_ORDER.FIRST]: { media: ['order-first md:order-none'] },
      [MEDIA_ORDER.LAST]: {},
    },
    wrapped: {
      true: { root: ['mt-0'] },
    },
    spacingTop: {
      [SPACING_SCALE.NONE]: { root: ['pt-6 sm:pt-6', '[--banner-top:6rem]'] },
      [SPACING_SCALE.SM]: { root: ['pt-8 sm:pt-8', '[--banner-top:7rem]'] },
      [SPACING_SCALE.MD]: { root: ['pt-12 sm:pt-12', '[--banner-top:10rem]'] },
      [SPACING_SCALE.LG]: { root: ['pt-16 sm:pt-16', '[--banner-top:13rem]'] },
      [SPACING_SCALE.XL]: { root: ['pt-24 sm:pt-24', '[--banner-top:18rem]'] },
    },
    spacingBottom: {
      [SPACING_SCALE.NONE]: {
        root: ['pb-6 sm:pb-6', '[--banner-bottom:6rem]'],
      },
      [SPACING_SCALE.SM]: { root: ['pb-8 sm:pb-8', '[--banner-bottom:7rem]'] },
      [SPACING_SCALE.MD]: {
        root: ['pb-12 sm:pb-12', '[--banner-bottom:10rem]'],
      },
      [SPACING_SCALE.LG]: {
        root: ['pb-16 sm:pb-16', '[--banner-bottom:13rem]'],
      },
      [SPACING_SCALE.XL]: {
        root: ['pb-24 sm:pb-24', '[--banner-bottom:18rem]'],
      },
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
      class: { root: ['bg-secondary', 'surface-secondary'] },
    },
    {
      variant: [CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT],
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { root: ['bg-brand-primary-muted', 'surface-brand-primary'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.LEFT,
      class: {
        overlay: [AZURE_SCRIM_CENTER_BELOW_SM, AZURE_SCRIM_LEFT_FROM_SM],
      },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.CENTER,
      class: { overlay: [AZURE_SCRIM_CENTER] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: {
        overlay: [AZURE_SCRIM_CENTER_BELOW_SM, AZURE_SCRIM_RIGHT_FROM_SM],
      },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
      position: CONTENT_ALIGNMENT.LEFT,
      class: {
        overlay: [NEUTRAL_SCRIM_CENTER_BELOW_SM, NEUTRAL_SCRIM_LEFT_FROM_SM],
      },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
      position: CONTENT_ALIGNMENT.CENTER,
      class: { overlay: [NEUTRAL_SCRIM_CENTER] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      tone: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
      position: CONTENT_ALIGNMENT.RIGHT,
      class: {
        overlay: [NEUTRAL_SCRIM_CENTER_BELOW_SM, NEUTRAL_SCRIM_RIGHT_FROM_SM],
      },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.LEFT,
      class: { root: ['items-center sm:items-start'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.CENTER,
      class: { root: ['items-center'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { root: ['items-center sm:items-end'] },
    },
    {
      variant: CTA_VARIANT.BANNER,
      position: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.RIGHT],
      class: {
        root: ['max-sm:text-center'],
        group: ['max-sm:mx-auto'],
        footnote: ['max-sm:mx-auto'],
        actions: ['max-sm:justify-center'],
      },
    },
    {
      variant: CTA_VARIANT.SPLIT,
      position: CONTENT_ALIGNMENT.RIGHT,
      class: { body: ['md:order-2'] },
    },
    // A centered Callout still reads lists left-aligned within the centered block — a fully centered list separates markers from their text.
    {
      variant: CTA_VARIANT.CALLOUT,
      alignment: CONTENT_ALIGNMENT.CENTER,
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
