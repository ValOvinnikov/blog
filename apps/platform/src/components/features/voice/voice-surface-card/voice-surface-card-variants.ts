import { tv } from '@platform/utils/tv/tv';

export const voiceSurfaceCardVariants = tv({
  slots: {
    card: ['[&_h3]:outline-hidden'],
    body: ['grid grid-cols-1 p-0 lg:grid-cols-2'],
    fields: ['flex min-w-0 flex-col gap-5 p-platform-card'],
  },
  variants: {
    isArchive: {
      false: {
        fields: ['max-md:p-3.5'],
      },
      true: {
        fields: ['max-lg:pb-0 max-md:px-3.5 max-md:pt-1'],
      },
    },
  },
});
