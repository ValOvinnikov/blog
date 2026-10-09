import { tv } from '@platform/utils/tv/tv';

export const segmentedControlVariants = tv({
  slots: {
    root: [
      'inline-flex flex-wrap items-center gap-[3px]',
      'rounded-[10px] border border-admin-control-line bg-admin-line-2 p-[3px]',
      'data-[disabled]:opacity-[.55]',
    ],
    option: [
      'min-h-11 rounded-[8px] border-0 bg-transparent px-[14px] py-[7px] md:min-h-0',
      'text-[13px] font-medium text-admin-muted',
      'cursor-pointer disabled:cursor-not-allowed',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      'data-[pressed]:bg-admin-surface data-[pressed]:text-admin-text data-[pressed]:shadow-admin',
    ],
    optionLabel: ['font-semibold'],
    optionDescription: ['font-mono text-[11px] font-normal text-admin-muted'],
  },
  variants: {
    hasDescriptions: {
      true: {
        root: ['items-stretch'],
        option: ['flex flex-col items-start gap-px text-left'],
      },
    },
  },
  defaultVariants: {
    hasDescriptions: false,
  },
});
