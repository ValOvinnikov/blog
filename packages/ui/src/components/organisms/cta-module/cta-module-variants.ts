import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  MEDIA_ORDER,
} from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

const CARD = [
  'mx-auto w-full max-w-4xl',
  'rounded-card border border-border shadow-card',
  'px-[calc(var(--spacing-card-x)*1.5)] sm:px-[calc(var(--spacing-card-x)*2)]',
  'py-[calc(var(--spacing-card-y)*16/7)] sm:py-[calc(var(--spacing-card-y)*20/7)]',
];

export const ctaModuleVariants = tv({
  slots: {
    root: ['relative isolate flex flex-col overflow-hidden'],
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
    actions: ['mt-5 flex flex-wrap items-center gap-3'],
    footnote: ['mt-3.5 max-w-measure font-mono text-caption text-subtle'],
  },
  variants: {
    variant: {
      [CTA_VARIANT.BANNER]: {
        body: ['max-w-measure', 'text-prose'],
      },
      [CTA_VARIANT.SPLIT]: {
        root: [
          ...CARD,
          'grid grid-cols-1 gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-center',
        ],
        media: ['sm:aspect-[4/3]'],
      },
      [CTA_VARIANT.CALLOUT]: {
        root: CARD,
        media: ['order-first mx-auto mb-6 w-full max-w-[420px]'],
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
