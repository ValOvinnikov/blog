import { tv } from '@blog/ui/lib/styling';

export const eyebrowVariants = tv({
  base: [
    'font-mono text-label font-medium uppercase tracking-eyebrow',
    'text-brand-primary',
  ],
  variants: {
    hasHref: {
      true: [
        'no-underline transition-colors duration-base ease-smooth',
        'hover:text-brand-primary-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
        'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      ],
    },
  },
});
