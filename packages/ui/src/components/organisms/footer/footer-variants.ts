import { BRAND_VARIANT, FOOTER_LAYOUT, FOOTER_SURFACE } from '@blog/config';
import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const footerVariants = tv({
  slots: {
    root: ['group/footer @container/footer w-full'],
    inner: [
      'flex flex-col gap-10',
      'mx-auto w-full max-w-page min-w-0 px-gutter py-10',
      'font-mono text-label text-muted',
    ],
    main: ['grid min-w-0 gap-10'],
    brand: ['flex min-w-0 flex-col gap-4'],
    divider: ['-mb-4 border-0 border-t border-border'],
    bottom: [
      'flex min-w-0 flex-col gap-3',
      '@min-[40rem]/footer:flex-row @min-[40rem]/footer:flex-wrap @min-[40rem]/footer:items-center @min-[40rem]/footer:justify-between',
    ],
  },
  variants: {
    layout: {
      [FOOTER_LAYOUT.COLUMNS]: {
        main: ['@min-[64rem]/footer:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'],
      },
      [FOOTER_LAYOUT.CENTRED]: {
        inner: ['text-center'],
        brand: ['items-center'],
        bottom: ['items-center @min-[40rem]/footer:justify-center'],
      },
      [FOOTER_LAYOUT.COMPACT]: {
        inner: [
          'gap-3 py-[0.875rem]',
          '@min-[40rem]/footer:flex-row @min-[40rem]/footer:flex-wrap @min-[40rem]/footer:items-center @min-[40rem]/footer:justify-between',
        ],
        main: ['flex'],
        bottom: ['@min-[40rem]/footer:flex-1'],
      },
      [FOOTER_LAYOUT.BIG_WORDMARK]: {
        main: ['@min-[64rem]/footer:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]'],
      },
    },
    surface: {
      [FOOTER_SURFACE.FULL_WIDTH]: {
        root: ['border-t border-border-strong'],
      },
      [FOOTER_SURFACE.CARD]: {
        root: ['px-3 pb-3'],
        inner: ['rounded-card border border-border shadow-card'],
      },
    },
    tone: {
      [BRAND_VARIANT.PRIMARY]: {},
      [BRAND_VARIANT.SECONDARY]: {},
      [BRAND_VARIANT.BRAND_PRIMARY]: {},
    },
  },
  compoundVariants: [
    {
      surface: FOOTER_SURFACE.FULL_WIDTH,
      tone: BRAND_VARIANT.PRIMARY,
      class: { root: ['bg-primary'] },
    },
    {
      surface: FOOTER_SURFACE.FULL_WIDTH,
      tone: BRAND_VARIANT.SECONDARY,
      class: { root: ['bg-secondary', 'surface-secondary'] },
    },
    {
      surface: FOOTER_SURFACE.FULL_WIDTH,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { root: ['bg-brand-primary-muted', 'surface-brand-primary'] },
    },
    {
      surface: FOOTER_SURFACE.CARD,
      tone: BRAND_VARIANT.PRIMARY,
      class: { inner: ['bg-primary'] },
    },
    {
      surface: FOOTER_SURFACE.CARD,
      tone: BRAND_VARIANT.SECONDARY,
      class: { inner: ['bg-secondary', 'surface-secondary'] },
    },
    {
      surface: FOOTER_SURFACE.CARD,
      tone: BRAND_VARIANT.BRAND_PRIMARY,
      class: { inner: ['bg-brand-primary-muted', 'surface-brand-primary'] },
    },
  ],
  defaultVariants: {
    layout: FOOTER_LAYOUT.COLUMNS,
    surface: FOOTER_SURFACE.FULL_WIDTH,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
  },
});

export type TFooterVariants = VariantProps<typeof footerVariants>;
