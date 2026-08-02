import { tv } from '@blog/ui/lib/styling';

export const postCardFooterVariants = tv({
  slots: {
    root: ['flex items-center gap-2', 'mt-auto pt-3', 'font-mono text-xs'],
    category: ['text-accent lowercase'],
  },
});
