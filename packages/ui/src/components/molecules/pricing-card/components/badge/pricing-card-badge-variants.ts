import { PILL, tv } from '@shinefold/ui/lib/styling';

export const pricingCardBadgeVariants = tv({
  base: [
    'absolute -top-3 left-1/2 -translate-x-1/2',
    PILL,
    'bg-tier-badge-fill text-tier-badge-label',
    'px-3 py-1 whitespace-nowrap',
  ],
});
