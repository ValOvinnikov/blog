import { TEXT_ROLE } from '@shinefold/config';
import { tv, TYPOGRAPHY } from '@shinefold/ui/lib/styling';

export const accountPanelTileVariants = tv({
  slots: {
    icon: ['text-brand-primary'],
    title: ['font-semibold in-aria-[current=page]:font-bold'],
    description: [TYPOGRAPHY[TEXT_ROLE.META], 'text-muted'],
  },
});
