import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: ['flex max-w-3xl flex-col gap-6'],
    alert: ['w-fit'],
    savedStatus: ['text-[12px] text-admin-ok'],
    liveStatus: ['sr-only'],
  },
});
