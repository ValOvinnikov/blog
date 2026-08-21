import { tv } from '@blog/ui/lib/styling';

export const taxonomyCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col gap-2',
      'bg-surface border-l-2 border-brand-primary',
      'px-card-x py-card-y',
      'transition-colors duration-base ease-console',
      'hover:bg-brand-primary-muted focus-within:bg-brand-primary-muted',
      'motion-reduce:transition-none',
    ],
    link: ['before:absolute before:inset-0'],
    description: ['text-prose leading-[1.55]', 'text-muted line-clamp-2'],
    count: ['font-mono text-label', 'text-subtle'],
  },
});
