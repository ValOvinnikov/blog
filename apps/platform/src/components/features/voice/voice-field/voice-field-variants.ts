import { tv } from '@platform/utils/tv/tv';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    input: [
      'h-11 px-2.5 py-0 text-platform-16 leading-6',
      'md:h-9 md:text-platform-13-5 md:leading-5',
    ],
    error: ['text-platform-11-5 leading-4 text-platform-bad'],
  },
});
