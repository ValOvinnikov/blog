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
    current: ['block min-w-0 flex-1 truncate'],
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
