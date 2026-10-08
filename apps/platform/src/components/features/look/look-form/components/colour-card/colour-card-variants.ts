import { tv } from '@platform/utils/tv/tv';

export const colourCardVariants = tv({
  slots: {
    hueField: ['flex w-full items-center gap-3.5'],
    swatch: [
      'size-[52px] shrink-0 rounded-admin shadow-admin ring-1 ring-inset ring-black/6',
    ],
    hueValue: [
      'min-w-[92px] shrink-0 text-right text-[12.5px] tabular-nums text-admin-muted',
    ],
    fieldError: ['mt-2 text-[11.5px] text-admin-bad'],
  },
});
