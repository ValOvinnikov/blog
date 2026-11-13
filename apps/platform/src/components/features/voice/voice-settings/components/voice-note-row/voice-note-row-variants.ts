import { tv } from '@platform/utils/tv/tv';

export const voiceNoteRowVariants = tv({
  slots: {
    root: ['flex flex-col gap-3 md:flex-row md:items-stretch md:gap-4'],
    note: ['min-w-0 flex-1'],
    languageEmphasis: ['font-semibold text-platform-text'],
    previewSwitch: ['flex flex-none items-center justify-end gap-2'],
    previewSwitchLabel: [
      'text-platform-12 leading-4 whitespace-nowrap text-platform-muted',
    ],
  },
});
