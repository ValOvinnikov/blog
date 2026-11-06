import { tv } from '@platform/utils/tv/tv';

export const voiceSettingsVariants = tv({
  slots: {
    sections: [
      'flex flex-col gap-4 md:gap-7',
      // <html>'s scroll padding clears the top bar; this clears the chip bar under it, plus 16px.
      '[&_*]:scroll-mt-[calc(var(--admin-voice-bar-height,0px)+--spacing(4))]',
    ],
  },
});
