import { tv } from '@blog/ui/lib/styling';

export const breadcrumbsVariants = tv({
  slots: {
    list: [
      'flex flex-nowrap items-center gap-x-1 min-w-0',
      'font-mono text-label text-subtle',
      'list-none p-0 m-0',
    ],
    item: [
      'flex items-center gap-x-1',
      "[&:not(:first-child)]:before:content-['/']",
      '[&:not(:first-child)]:before:mr-1 [&:not(:first-child)]:before:text-subtle',
    ],
    link: [
      'text-subtle no-underline',
      'transition-colors duration-base ease-smooth',
      'hover:text-brand-primary',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    current: ['block min-w-0 flex-1 truncate', 'text-text'],
    homeLabel: ['sr-only'],
  },
  variants: {
    isCurrent: {
      true: { item: ['min-w-0 flex-1 overflow-hidden'] },
      false: { item: ['shrink-0'] },
    },
  },
  defaultVariants: {
    isCurrent: false,
  },
});
