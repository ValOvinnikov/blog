import { tv } from 'tailwind-variants';

export const postCardVariants = tv({
  slots: {
    root: [
      'flex flex-col h-full overflow-hidden rounded',
      'bg-surface border border-border',
      'transition-colors hover:border-border-strong',
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
