import { tv } from '@platform/utils/tv/tv';

export const voiceSectionVariants = tv({
  slots: {
    disclosure: ['flex flex-col gap-2'],
    titleBlock: ['flex min-w-0 flex-col'],
    title: [
      'text-platform-16 leading-platform-22 font-semibold text-platform-text',
    ],
    meta: ['text-platform-12-5 leading-platform-18 text-platform-muted'],
    cards: ['flex flex-col gap-4 md:gap-6'],
  },
  variants: {
    isOpen: {
      false: { disclosure: ['md:gap-2.5'] },
      true: { disclosure: ['md:gap-3'] },
    },
    hasErrors: {
      true: { meta: ['text-platform-bad'] },
    },
  },
});
