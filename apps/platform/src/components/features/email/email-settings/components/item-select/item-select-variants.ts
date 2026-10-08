import { tv } from '@platform/utils/tv/tv';

export const itemSelectVariants = tv({
  slots: {
    root: ['flex', 'flex-col', 'gap-1.5', 'lg:hidden', 'xl:col-span-2'],
    label: ['text-[12.5px]', 'font-semibold', 'text-admin-text'],
    select: [
      'h-10 w-full rounded-admin border border-admin-line bg-admin-surface px-3',
      'text-[13.5px] text-admin-text',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand',
    ],
  },
});
