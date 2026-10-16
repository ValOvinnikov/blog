import { LINK_UNDERLINE_EMPHASIS, tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const navLinkVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-x-1.5 no-underline',
      'font-mono text-meta',
      'transition-colors duration-base ease-smooth',
      'hover:text-text',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-ambient',
    ],
    label: ['sr-only'],
  },
  variants: {
    isActive: {
      true: { root: ['text-brand-primary', ...LINK_UNDERLINE_EMPHASIS] },
      false: { root: ['text-muted'] },
    },
    variant: {
      plain: { root: [] },
      outlined: {
        root: [
          'size-9 shrink-0 justify-center rounded-full border border-current pb-0',
        ],
      },
    },
  },
  defaultVariants: { isActive: false, variant: 'plain' },
});

export type TNavLinkVariants = VariantProps<typeof navLinkVariants>;
