import { tv } from '@platform/utils/tv/tv';

export const settingsFormShellVariants = tv({
  slots: {
    root: [
      'flex flex-col gap-6',
      'md:[html:has(&)]:scroll-pb-[calc(var(--spacing-admin-dock)+var(--spacing-admin-dock-clearance))]',
    ],
    alert: ['w-fit'],
    liveStatus: ['sr-only'],
  },
  variants: {
    isWide: {
      false: { root: ['max-w-3xl'] },
    },
    hasCompactGap: {
      true: { root: ['gap-admin-form-gap'] },
    },
    // 120px (48px archived) below the last content, less the content column's own 26px padding.
    isArchived: {
      true: { root: ['md:pb-[22px]'] },
      false: { root: ['md:pb-[94px]'] },
    },
  },
  defaultVariants: {
    isWide: false,
    hasCompactGap: false,
    isArchived: false,
  },
});
