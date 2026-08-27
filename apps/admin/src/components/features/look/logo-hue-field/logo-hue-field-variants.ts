import { tv } from '@admin/utils/tv/tv';

export const logoHueFieldVariants = tv({
  slots: {
    root: ['flex w-full flex-col gap-3'],
    switchRow: ['flex items-center gap-2.5 text-[13px] text-admin-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-admin-line',
      'transition-colors',
      'data-[checked]:bg-admin-brand',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-admin',
      'transition-transform',
      'data-[checked]:translate-x-4',
    ],
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
