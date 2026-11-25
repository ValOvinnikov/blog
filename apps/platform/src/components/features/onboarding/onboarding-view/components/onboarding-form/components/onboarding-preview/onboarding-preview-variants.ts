import { tv } from '@platform/utils/tv/tv';

export const onboardingPreviewVariants = tv({
  slots: { section: [], stage: [] },
  variants: {
    isPhone: {
      true: { section: ['gap-2.5'] },
      false: {},
    },
    isFull: {
      true: {
        section: ['min-h-0 flex-1'],
        stage: [
          'flex min-h-0 flex-1 flex-col justify-center overflow-hidden bg-transparent p-0',
        ],
      },
      false: {},
    },
  },
});
