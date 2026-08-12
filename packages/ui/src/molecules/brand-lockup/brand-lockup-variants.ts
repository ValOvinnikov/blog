import { tv } from '@blog/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex flex-col items-start gap-1'],
    specLine: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
  },
});
