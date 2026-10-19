import { tv } from '@blog/ui/lib/styling';

export const contactFormSuccessVariants = tv({
  slots: {
    root: ['flex flex-col gap-2', 'item-card surface-card', 'px-6 py-5'],
    message: ['m-0 font-body text-prose text-muted'],
  },
});
