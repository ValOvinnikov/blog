import { tv } from '@blog/ui/lib/styling';

export const taxonomyCardVariants = tv({
  slots: {
    root: [
      'relative flex h-full flex-col gap-2',
      'item-card surface-card',
      'px-card-x py-card-y',
      'transition-colors duration-base ease-smooth',
      'hover:bg-brand-primary-muted focus-within:bg-brand-primary-muted',
      'focus-within:surface-brand-primary',
      'motion-reduce:transition-none',
    ],
    link: ['before:absolute before:inset-0'],
    accessibleName: ['sr-only'],
    description: ['text-prose leading-[1.55]', 'text-muted line-clamp-2'],
    count: ['font-mono text-label', 'text-subtle'],
  },
});
