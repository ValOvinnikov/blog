import { tv } from '@platform/utils/tv/tv';

export const viewTabsVariants = tv({
  slots: {
    root: ['lg:hidden'],
    list: [
      'grid grid-cols-2 gap-[3px] rounded-admin-control bg-admin-line-2 p-[3px]',
    ],
    tab: [
      'min-h-11 cursor-pointer rounded-admin-control px-[14px] py-[7px] md:min-h-0',
      'text-[13px] font-medium text-admin-muted',
      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-brand',
      'data-[active]:bg-admin-surface data-[active]:text-admin-text data-[active]:shadow-admin',
    ],
  },
});
