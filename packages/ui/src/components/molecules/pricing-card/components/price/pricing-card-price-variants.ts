import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const pricingCardPriceVariants = tv({
  slots: {
    root: ['flex flex-col gap-1'],
    prefix: [TYPOGRAPHY[TEXT_ROLE.LABEL], 'text-muted'],
    headline: ['block'],
    amount: [TYPOGRAPHY[TEXT_ROLE.FIGURE]],
    period: ['inline-block text-sm', 'text-muted'],
    compareAtLabel: ['sr-only'],
    compareAtValue: ['text-sm line-through', 'text-muted'],
  },
});
