import { tv } from '@platform/utils/tv/tv';

export const onboardingPreviewVariants = tv({
  slots: {
    browser: [
      'overflow-hidden rounded-admin border border-admin-line bg-admin-surface shadow-admin-lg',
    ],
    site: ['p-3'],
  },
});
