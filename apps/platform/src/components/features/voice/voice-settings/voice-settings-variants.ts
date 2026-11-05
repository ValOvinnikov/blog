import { tv } from '@platform/utils/tv/tv';

export const voiceSettingsVariants = tv({
  slots: {
    // The content column's 16px phone padding less 2: the board's 14.
    shell: ['max-md:-mt-0.5'],
    cards: ['flex flex-col gap-6'],
  },
});
