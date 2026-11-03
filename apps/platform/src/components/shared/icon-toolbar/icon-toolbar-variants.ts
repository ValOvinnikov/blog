import { tv } from '@platform/utils/tv/tv';

export const iconToolbarVariants = tv({
  slots: {
    root: ['flex flex-wrap items-center gap-2'],
    endSlot: ['flex min-w-0 items-center gap-2'],
  },
  variants: {
    isEndOnOwnLine: {
      true: { endSlot: ['basis-full'] },
      false: { endSlot: ['flex-1 basis-0 justify-end'] },
    },
  },
});
