import { tv } from '@platform/utils/tv/tv';

export const colourCardVariants = tv({
  slots: {
    hueField: ['flex w-full items-center gap-3.5'],
    hueValue: [
      'w-[62px] shrink-0 text-right font-admin-mono text-admin-12-5 tabular-nums text-admin-muted',
    ],
  },
});
