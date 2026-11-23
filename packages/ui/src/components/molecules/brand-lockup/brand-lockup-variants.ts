import { tv } from '@shinefold/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex flex-col items-start gap-1'],
    lightMark: ['dark:hidden'],
    darkMark: ['hidden dark:inline-block'],
    tagline: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
  },
});
