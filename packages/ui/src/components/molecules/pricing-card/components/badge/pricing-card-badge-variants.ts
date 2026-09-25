import { tv } from '@blog/ui/lib/styling';

export const pricingCardBadgeVariants = tv({
  base: [
    'absolute -top-3 left-1/2 -translate-x-1/2',
    'rounded-full px-3 py-1',
    'font-mono text-label font-medium uppercase tracking-label',
    'bg-brand-primary-solid text-brand-primary-contrast',
    'shadow-sm',
  ],
});
