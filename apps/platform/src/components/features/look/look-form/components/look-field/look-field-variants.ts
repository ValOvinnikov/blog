import { tv } from '@platform/utils/tv/tv';

export const lookFieldVariants = tv({
  slots: {
    label: [
      'mb-[5px] flex items-center gap-2 text-[13px] font-semibold text-admin-text',
    ],
    optionalTag: [
      'rounded-full bg-admin-line-2 px-2 py-px text-[11px] font-medium text-admin-faint',
    ],
    hint: ['-mt-px mb-2 text-[12px] text-admin-muted'],
  },
});
