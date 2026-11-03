import { tv } from '@platform/utils/tv/tv';

export const previewDeviceNoteVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center gap-2 text-admin-12-5 text-admin-text'],
    action: [
      'gap-1.5 text-admin-12-5 text-admin-brand-strong underline underline-offset-2',
    ],
  },
});
