import {
  FOCUS_RING,
  LINK_UNDERLINE_AT_REST,
  LINK_UNDERLINE_EMPHASIS,
  TRANSITION_COLORS,
  tv,
} from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const textLinkVariants = tv({
  slots: {
    root: ['rounded-sm'],
    label: ['sr-only'],
  },
  variants: {
    appearance: {
      prose: {
        root: [
          ...LINK_UNDERLINE_AT_REST,
          'text-brand-primary decoration-current',
        ],
      },
      nav: {
        root: [
          'inline-flex items-center gap-x-1.5 no-underline',
          'font-mono text-meta',
        ],
      },
      quiet: { root: ['no-underline'] },
      accent: { root: ['text-brand-primary no-underline'] },
    },
    variant: {
      plain: { root: [] },
      outlined: {
        root: [
          'size-9 shrink-0 justify-center rounded-full border border-current pb-0',
        ],
      },
    },
    currentStyle: {
      underline: { root: [] },
      weight: { root: [] },
    },
    hasHref: {
      true: { root: [TRANSITION_COLORS, FOCUS_RING] },
      false: { root: ['cursor-default'] },
    },
    isCurrent: {
      true: { root: [] },
      false: { root: [] },
    },
    isStretched: {
      true: { root: ['before:absolute before:inset-0 before:rounded-item'] },
      false: { root: [] },
    },
  },
  compoundVariants: [
    {
      hasHref: true,
      isStretched: true,
      class: {
        root: [
          'focus-visible:ring-0 focus-visible:ring-offset-0',
          // Important, or the unlayered forced-colours rule redraws the ring around the clamped title.
          'focus-visible:outline-none!',
          'focus-visible:before:outline-2 focus-visible:before:-outline-offset-2',
          'focus-visible:before:outline-(--ring)',
          'forced-colors:focus-visible:before:outline-[Highlight]',
        ],
      },
    },
    {
      appearance: 'prose',
      hasHref: true,
      class: {
        root: ['hover:decoration-2 hover:text-brand-primary-hover'],
      },
    },
    {
      appearance: 'nav',
      isCurrent: false,
      class: { root: ['text-muted'] },
    },
    {
      appearance: 'nav',
      isCurrent: true,
      class: { root: ['text-brand-primary'] },
    },
    {
      appearance: 'nav',
      isCurrent: false,
      hasHref: true,
      class: { root: ['hover:text-text'] },
    },
    {
      appearance: 'nav',
      isCurrent: true,
      hasHref: true,
      class: { root: ['hover:text-brand-primary-hover'] },
    },
    {
      appearance: 'nav',
      isCurrent: true,
      currentStyle: 'underline',
      class: { root: LINK_UNDERLINE_EMPHASIS },
    },
    {
      appearance: 'nav',
      isCurrent: true,
      currentStyle: 'weight',
      class: { root: ['font-semibold'] },
    },
    {
      appearance: 'quiet',
      isCurrent: true,
      class: { root: ['text-text'] },
    },
    {
      appearance: 'quiet',
      hasHref: true,
      class: { root: ['hover:text-brand-primary'] },
    },
    {
      appearance: 'accent',
      hasHref: true,
      class: { root: ['hover:text-brand-primary-hover hover:underline'] },
    },
  ],
  defaultVariants: {
    appearance: 'prose',
    variant: 'plain',
    currentStyle: 'underline',
    hasHref: true,
    isCurrent: false,
    isStretched: false,
  },
});

export type TTextLinkVariants = VariantProps<typeof textLinkVariants>;
