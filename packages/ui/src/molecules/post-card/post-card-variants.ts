import { tv } from '@blog/ui/lib/tv';

export const postCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col overflow-hidden rounded-md',
      'bg-surface border border-border',
      'transition-[transform,border-color] duration-base ease-console',
      'hover:-translate-y-0.5 hover:border-border-strong',
      'focus-within:-translate-y-0.5 focus-within:border-border-strong',
      'motion-reduce:transition-none motion-reduce:transform-none',
    ],
    content: ['flex flex-col flex-1', 'px-card-x py-card-y gap-2'],
    excerpt: ['text-sm leading-[1.55]', 'text-muted line-clamp-3'],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
});
