import { tv } from '@platform/utils/tv/tv';

export const voiceSettingsVariants = tv({
  slots: {
    intro: ['flex flex-col gap-3'],
    controls: ['flex flex-wrap items-center justify-between gap-3'],
    segmented: ['[&_button]:min-h-11 md:[&_button]:min-h-0'],
    note: ['text-[12.5px] text-admin-muted'],
    cards: ['flex flex-col gap-5'],
  },
});
