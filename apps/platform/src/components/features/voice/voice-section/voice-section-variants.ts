import { tv } from '@platform/utils/tv/tv';
import { VOICE_ANCHOR_CLASSES } from '@platform/utils/voice-sections/voice-sections';

export const voiceSectionVariants = tv({
  slots: {
    root: [VOICE_ANCHOR_CLASSES],
    disclosure: ['flex flex-col gap-2'],
    titleBlock: ['flex min-w-0 flex-col'],
    title: ['text-admin-16 leading-admin-22 font-semibold text-admin-text'],
    meta: ['text-admin-12-5 leading-admin-18 text-admin-muted'],
    cards: ['flex flex-col gap-4 md:gap-6'],
  },
  variants: {
    isOpen: {
      false: { disclosure: ['md:gap-2.5'] },
      true: { disclosure: ['md:gap-3'] },
    },
    hasErrors: {
      true: { meta: ['text-admin-bad'] },
    },
  },
});
