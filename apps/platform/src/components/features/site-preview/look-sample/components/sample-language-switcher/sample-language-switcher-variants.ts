import { HEADER_CONTROL, HEADER_CONTROL_FRAME } from '@blog/ui/lib/styling';
import { tv } from '@platform/utils/tv/tv';

export const sampleLanguageSwitcherVariants = tv({
  slots: {
    codeList: [HEADER_CONTROL_FRAME, 'flex items-center gap-0.5 p-[5px]'],
    codeLink: [
      'h-6 min-w-6 justify-center rounded-full px-1.5 text-label',
      'aria-[current=page]:bg-brand-primary',
      'aria-[current=page]:text-brand-primary-contrast',
    ],
    codeLabel: ['sr-only'],
    trigger: [
      HEADER_CONTROL,
      'inline-flex shrink-0 items-center justify-center gap-1',
    ],
    caret: ['size-3'],
  },
  variants: {
    hasGlobe: {
      true: { trigger: ['size-9 px-0'] },
      false: { trigger: ['size-auto min-h-9 px-3 py-0'] },
    },
  },
});
