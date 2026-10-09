import { tv } from '@platform/utils/tv/tv';

export const voiceSettingsVariants = tv({
  slots: {
    intro: ['flex flex-col gap-3'],
    controls: ['flex flex-wrap items-center justify-between gap-3'],
    languageEmphasis: ['font-semibold text-admin-text'],
    cards: ['flex flex-col gap-6'],
  },
});
