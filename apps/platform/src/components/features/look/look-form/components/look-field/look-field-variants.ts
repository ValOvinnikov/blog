import { tv } from '@platform/utils/tv/tv';

export const lookFieldVariants = tv({
  slots: {
    field: ['flex min-w-0 flex-col gap-1.5'],
    label: [
      'flex items-center gap-2 text-admin-13 leading-admin-18 font-semibold text-admin-text',
    ],
    optional: ['text-admin-12 font-medium text-admin-muted'],
    hint: ['m-0 text-admin-12-5 leading-admin-18 text-admin-muted'],
    error: ['text-admin-11-5 text-admin-bad'],
  },
});
