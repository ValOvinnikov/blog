import { tv } from '@platform/utils/tv/tv';

export const logoHueFieldVariants = tv({
  slots: {
    root: ['flex w-full flex-col gap-3'],
    switchRow: ['flex flex-wrap items-center gap-x-3 gap-y-1'],
    readout: ['text-admin-12-5 text-admin-muted'],
    hueField: ['flex items-center gap-3.5'],
    tones: ['flex overflow-hidden'],
    tone: ['h-full w-1/3'],
    hueValue: [
      'w-admin-hue-readout shrink-0 text-right font-admin-mono text-admin-12-5 tabular-nums text-admin-muted',
    ],
  },
});
