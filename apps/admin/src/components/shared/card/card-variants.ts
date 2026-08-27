import { tv } from '@admin/utils/tv/tv';

export const cardVariants = tv({
  slots: {
    root: [
      'bg-admin-surface border border-admin-line',
      'rounded-admin shadow-admin',
    ],
    header: [
      'flex flex-wrap items-center gap-2.5',
      'border-b border-admin-line-2 px-[18px] py-3.5',
    ],
    headerTitleGroup: ['min-w-0'],
    headerDescription: ['mt-0.5 block text-[12.5px] text-admin-muted'],
    headerActions: ['ml-auto flex items-center gap-2'],
    body: ['p-[18px]'],
    footer: [
      'flex items-center gap-2.5',
      'border-t border-admin-line-2 bg-admin-surface-2 px-[18px] py-[13px]',
      'rounded-b-admin',
    ],
  },
});
