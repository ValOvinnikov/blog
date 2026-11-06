import { tv } from '@platform/utils/tv/tv';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    note: ['leading-4'],
    token: ['font-admin-mono text-admin-12 leading-4 font-medium'],
    error: ['text-admin-11-5 text-admin-bad'],
  },
});
