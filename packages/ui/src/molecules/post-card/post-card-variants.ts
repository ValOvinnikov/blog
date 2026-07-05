import { tv } from 'tailwind-variants';

export const postCardVariants = tv({
  slots: {
    root: [
      'flex flex-col h-full overflow-hidden rounded-lg',
      'bg-bg border border-border',
      'transition-shadow hover:shadow-md',
    ],
    image: ['relative w-full aspect-video overflow-hidden', 'bg-surface-2'],
    content: ['flex flex-col flex-1', 'px-5 py-4 gap-3'],
    titleLink: [
      'focus:outline-none',
      'focus-visible:ring-2 focus-visible:ring-accent rounded',
    ],
    title: [
      'font-display font-bold leading-tight tracking-tight',
      'text-fg hover:text-accent transition-colors',
    ],
    excerpt: ['text-sm leading-relaxed', 'text-text-muted line-clamp-3'],
    meta: [
      'flex items-center gap-2 mt-auto pt-3',
      'border-t border-border',
      'text-xs text-text-muted',
    ],
    tags: ['flex flex-wrap gap-1.5 mt-1'],
  },
});
