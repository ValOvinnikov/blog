import { tv } from '@blog/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-2'],
    text: ['flex flex-col justify-center leading-none'],
    wordmark: ['sr-only sm:not-sr-only sm:inline-block'],
    specLine: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
  },
});
