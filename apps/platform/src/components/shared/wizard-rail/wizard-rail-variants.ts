import { tv } from '@platform/utils/tv/tv';

export const wizardRailVariants = tv({
  slots: {
    root: [
      'flex h-full flex-col',
      'rounded-admin border border-admin-line bg-admin-surface p-[18px] shadow-admin',
    ],
    list: ['flex flex-col'],
    item: ['flex flex-1 flex-wrap gap-2.5'],
    indicatorCol: ['flex flex-none flex-col items-center self-stretch'],
    circle: [
      'flex h-6 w-6 flex-none items-center justify-center',
      'rounded-full text-xs font-bold',
    ],
    connector: ['my-1 w-0.5 flex-1 bg-admin-line-2'],
    stepBody: ['flex min-w-0 flex-1 flex-col pb-[9px]'],
    stepTitle: ['text-[13px] font-semibold text-admin-text'],
    stepDescription: ['text-[11.5px] text-admin-faint'],
  },
  variants: {
    isActive: {
      true: { circle: ['bg-admin-brand text-white'] },
      false: { circle: ['bg-admin-line-2 text-admin-muted'] },
    },
  },
  defaultVariants: {
    isActive: false,
  },
});
