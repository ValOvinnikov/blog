import { tv } from '@blog/ui/lib/styling';

export const brandLockupVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-2'],
    text: ['flex flex-col justify-center leading-none'],
    wordmark: ['text-base sm:text-[19px]'],
    specLine: ['hidden md:block', 'font-mono text-label', 'text-text-subtle'],
  },
});
