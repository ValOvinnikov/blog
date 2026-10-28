import { tv } from '@platform/utils/tv/tv';

export const onboardingPreviewVariants = tv({
  slots: {
    browser: ['overflow-hidden rounded-admin border shadow-admin-lg'],
    site: ['p-3'],
  },
  variants: {
    isDark: {
      true: { browser: ['border-admin-side-line bg-admin-side'] },
      false: { browser: ['border-admin-line bg-admin-surface'] },
    },
  },
});
