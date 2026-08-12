import { tv } from '@blog/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-2'],
    specLine: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
  },
});
