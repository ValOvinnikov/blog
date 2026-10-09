import { tv } from '@platform/utils/tv/tv';

export const logoHueFieldVariants = tv({
  slots: {
    root: ['flex w-full flex-col gap-3'],
    hueField: ['flex items-center gap-3'],
    tones: [
      'flex h-[52px] w-[51px] shrink-0 overflow-hidden rounded-admin shadow-admin ring-1 ring-inset ring-black/6',
    ],
    tone: ['h-full w-1/3'],
    hueValue: [
      'min-w-[92px] shrink-0 text-right text-[12.5px] tabular-nums text-admin-muted',
    ],
  },
  variants: {
    follows: {
      true: { hueField: ['pointer-events-none opacity-50'] },
      false: {},
    },
  },
  defaultVariants: {
    follows: false,
  },
});
