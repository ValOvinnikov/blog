import { tv } from '@platform/utils/tv/tv';

export const lookFieldVariants = tv({
  slots: {
    group: ['min-w-0'],
    label: [
      'mb-[5px] flex items-center gap-2 text-[13px] font-semibold text-admin-text',
    ],
    hint: ['-mt-px mb-2 text-[12px] text-admin-muted'],
    error: ['mt-2 text-[11.5px] text-admin-bad'],
  },
});
