import { tv } from 'tailwind-variants';

export const breadcrumbsVariants = tv({
  slots: {
    root: ['min-w-0 flex-1'],
    list: [
      'flex list-none flex-wrap items-center gap-[7px] p-0 text-sm text-admin-muted',
    ],
    item: ['flex items-center gap-[7px]'],
    sep: ['text-xs text-admin-faint'],
    link: [
      'rounded-[5px] px-1 py-0.5 text-admin-muted no-underline',
      'hover:bg-admin-line-2 hover:text-admin-text',
    ],
    current: ['max-w-[280px] truncate font-semibold text-admin-text'],
  },
});
