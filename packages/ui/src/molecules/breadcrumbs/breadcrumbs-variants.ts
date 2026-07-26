import { tv } from '@blog/ui/lib/styling';

export const breadcrumbsVariants = tv({
  slots: {
    root: ['my-4'],
    list: [
      'flex flex-wrap items-center gap-x-1',
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
      'transition-colors duration-base ease-console',
      'hover:text-accent',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    current: ['text-text'],
  },
});
