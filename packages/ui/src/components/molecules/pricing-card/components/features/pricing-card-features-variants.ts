import { tv } from '@blog/ui/lib/styling';

export const pricingCardFeaturesVariants = tv({
  slots: {
    root: ['flex flex-1 flex-col gap-2', 'text-sm text-text'],
    item: ['flex items-start gap-2'],
    icon: ['mt-0.5 shrink-0 text-brand-primary'],
  },
});
