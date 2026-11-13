import { tv } from '@platform/utils/tv/tv';

export const voiceFieldHeaderVariants = tv({
  slots: {
    labelRow: ['flex min-h-5 items-center gap-2'],
    label: [
      'flex-1 text-platform-14 leading-5 font-semibold text-platform-text',
      'md:text-platform-13 md:leading-platform-18',
    ],
    hintRow: ['flex min-h-11 items-center gap-2 md:min-h-7'],
    hint: ['flex-1 leading-4'],
  },
  variants: {
    isInListRow: {
      true: {
        label: ['sr-only'],
      },
    },
  },
});
