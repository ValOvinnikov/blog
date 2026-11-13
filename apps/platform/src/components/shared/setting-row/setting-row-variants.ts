import { tv } from '@platform/utils/tv/tv';

export const settingRowVariants = tv({
  slots: {
    root: [
      'flex flex-wrap items-center justify-between',
      'gap-x-6 gap-y-2 py-3',
      'border-b border-platform-line-2 last:border-b-0',
    ],
    content: ['min-w-0 flex-1'],
    label: ['block text-platform-13 font-semibold text-platform-text'],
    description: ['mt-0.5 block'],
    control: ['flex shrink-0 items-center gap-2'],
  },
  variants: {
    isNested: {
      true: { root: 'ms-6' },
    },
  },
});
