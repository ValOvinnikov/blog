import { tv } from '@platform/utils/tv/tv';

export const lookFieldVariants = tv({
  slots: {
    group: ['min-w-0'],
    label: [
      'mb-[5px] flex items-center gap-2 text-admin-13 font-semibold text-admin-text',
    ],
    hint: ['-mt-px mb-2'],
    lock: ['-mt-1 mb-2'],
    error: ['mt-2 text-admin-11-5 text-admin-bad'],
  },
});
