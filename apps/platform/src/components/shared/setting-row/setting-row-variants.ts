import { tv } from '@platform/utils/tv/tv';

export const settingRowVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center justify-between',
      'gap-x-6 gap-y-2 py-3',
      'border-b border-admin-line-2 last:border-b-0',
    ],
    content: ['min-w-0 flex-1'],
    label: ['block text-[13px] font-semibold text-admin-text'],
    description: ['mt-0.5 block'],
    reason: [
      'mt-[5px] flex items-start gap-[5px]',
      'text-[12px] leading-[1.45] text-admin-muted',
    ],
    control: ['flex shrink-0 items-center gap-2'],
  },
});
