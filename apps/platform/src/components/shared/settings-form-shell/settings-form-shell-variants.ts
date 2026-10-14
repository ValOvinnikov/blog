import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    alert: ['w-fit'],
    savedStatus: ['text-admin-12 text-admin-ok'],
    liveStatus: ['sr-only'],
  },
  variants: {
    isWide: {
      false: { root: ['max-w-3xl'] },
    },
  },
  defaultVariants: {
    isWide: false,
  },
});
