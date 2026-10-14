import { tv } from '@blog/ui/lib/styling';

export const pricingCardPriceVariants = tv({
  slots: {
    root: ['flex flex-col gap-1'],
    prefix: ['font-mono text-label uppercase tracking-label', 'text-muted'],
    headline: ['block'],
    amount: ['font-display text-2xl font-semibold', 'text-text'],
    period: ['inline-block text-sm', 'text-muted'],
    compareAtLabel: ['sr-only'],
    compareAtValue: ['text-sm line-through', 'text-muted'],
  },
});
