import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: ['flex flex-col gap-6'],
    alert: ['w-fit'],
    liveStatus: ['sr-only'],
  },
  variants: {
    isWide: {
      false: { root: ['max-w-3xl'] },
    },
    hasCompactGap: {
      true: { root: ['gap-[18px]'] },
    },
  },
  defaultVariants: {
    isWide: false,
    hasCompactGap: false,
  },
});
