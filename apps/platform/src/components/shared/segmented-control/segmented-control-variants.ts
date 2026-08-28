import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    root: [
      'inline-flex flex-wrap items-center gap-[3px]',
      'rounded-[10px] bg-admin-line-2 p-[3px]',
      'data-[disabled]:opacity-[.55]',
    ],
    option: [
      'rounded-[8px] border-0 bg-transparent px-[14px] py-[7px]',
      'text-[13px] font-medium text-admin-muted',
      'cursor-pointer disabled:cursor-not-allowed',
      'data-[pressed]:bg-admin-surface data-[pressed]:text-admin-text data-[pressed]:shadow-admin',
    ],
  },
});
