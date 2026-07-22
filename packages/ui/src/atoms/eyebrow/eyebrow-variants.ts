import { tv } from '@blog/ui/lib/styling';
import type { VariantProps } from 'tailwind-variants';

export const eyebrowVariants = tv({
  base: [
    'font-mono text-label font-medium uppercase tracking-eyebrow',
    'text-accent',
  ],
  variants: {
    hasHref: {
      true: [
        'no-underline transition-colors duration-base ease-console',
        'hover:text-accent-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      ],
    },
  },
});

export type TEyebrowVariants = VariantProps<typeof eyebrowVariants>;
