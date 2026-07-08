import { tv } from 'tailwind-variants';

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
    content: ['flex flex-col flex-1', 'px-4 py-4 gap-2'],
    excerpt: ['text-sm leading-[1.55]', 'text-text-muted line-clamp-3'],
    meta: [
      'flex items-center gap-2 mt-auto pt-3',
      'border-t border-border',
      'font-mono text-xs text-text-subtle',
    ],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
});
