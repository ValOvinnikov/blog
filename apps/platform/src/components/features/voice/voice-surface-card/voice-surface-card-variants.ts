import { tv } from '@platform/utils/tv/tv';
import { voiceAnchorVariants } from '@platform/utils/voice-anchor-variants/voice-anchor-variants';

export const voiceSurfaceCardVariants = tv({
  slots: {
    card: [voiceAnchorVariants(), '[&_h3]:outline-hidden'],
    body: ['grid grid-cols-1 p-0 lg:grid-cols-2'],
    fields: ['flex min-w-0 flex-col gap-4 p-admin-card'],
  },
  variants: {
    isArchive: {
      true: {
        fields: ['max-lg:pb-0 max-md:px-3.5 max-md:pt-1'],
      },
    },
  },
});
