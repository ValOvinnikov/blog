import { tv } from '@blog/ui/lib/styling';

export const logoVariants = tv({
  slots: {
    root: [
      'inline-flex items-baseline whitespace-nowrap',
      'font-display text-[19px] font-medium tracking-[-0.01em]',
      'text-text',
    ],
    suffix: ['font-mono text-sm font-normal', 'text-accent'],
  },
});
