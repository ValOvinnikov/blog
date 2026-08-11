import { tv } from '@blog/ui/lib/styling';

export const postCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col overflow-hidden',
      'bg-surface border-l-2 border-brand-primary',
      'transition-colors duration-base ease-console',
      'hover:bg-brand-primary-muted focus-within:bg-brand-primary-muted',
      'motion-reduce:transition-none',
    ],
    content: ['flex flex-col flex-1', 'px-card-x py-card-y gap-2'],
    excerpt: ['text-prose leading-[1.55]', 'text-muted line-clamp-2'],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
});
