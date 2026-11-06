import { tv } from '@platform/utils/tv/tv';

export const voiceFieldVariants = tv({
  slots: {
    root: ['flex flex-col gap-2'],
    input: [
      'h-11 px-2.5 py-0 text-admin-16 leading-6',
      'md:h-9 md:text-admin-13-5 md:leading-5',
    ],
    error: ['text-admin-11-5 leading-4 text-admin-bad'],
  },
});
