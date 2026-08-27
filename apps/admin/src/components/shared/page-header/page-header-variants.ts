import { tv } from '@admin/utils/tv/tv';

export const pageHeaderVariants = tv({
  slots: {
    root: ['flex flex-wrap items-start gap-4', 'mb-5'],
    titleGroup: ['min-w-0'],
    titleRow: ['flex flex-wrap items-center gap-2.5'],
    description: ['mt-1'],
    actions: ['flex flex-wrap items-center gap-2', 'ml-auto'],
  },
});
