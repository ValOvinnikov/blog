import { tv } from '@blog/ui/lib/styling';

export const pricingCardFeaturesVariants = tv({
  slots: {
    root: ['flex flex-col gap-2', 'text-lead leading-snug text-text'],
    item: ['flex items-start gap-2'],
    icon: ['mt-0.5 shrink-0 text-brand-primary'],
  },
});
