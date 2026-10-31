import { tv } from '@platform/utils/tv/tv';

export const cardVariants = tv({
  slots: {
    root: [
      'flex min-w-0 flex-col',
      'bg-admin-surface border border-admin-line',
      'rounded-admin shadow-admin',
    ],
    header: [
      'flex min-h-[50px] flex-wrap items-center gap-2.5',
      'rounded-t-admin border-b border-admin-line bg-admin-surface-head px-[18px] py-3',
    ],
    headerTitleGroup: ['min-w-0'],
    headerDescription: [
      'mt-0.5 block text-admin-12-5 leading-[18px] text-admin-muted',
    ],
    headerActions: ['ml-auto flex items-center gap-2'],
    body: ['min-w-0 flex-1 px-[18px] py-4'],
    footer: [
      'flex items-center gap-2.5',
      'border-t border-admin-line-2 bg-admin-surface-2 px-[18px] py-[11px]',
      'rounded-b-admin',
    ],
  },
});
