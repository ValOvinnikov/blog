import { tv } from 'tailwind-variants';

export const contactFormSuccessVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-2',
      'rounded-card border-l-2 border-brand-primary bg-surface-2 surface-nested',
      'px-6 py-5',
    ],
    message: ['m-0 font-body text-prose text-muted'],
  },
});
