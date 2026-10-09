import { tv } from '@platform/utils/tv/tv';

export const sampleLanguageSwitcherVariants = tv({
  slots: {
    codeList: [
      'flex items-center gap-0.5 rounded-full border border-border-strong p-0.5',
    ],
    codeLink: [
      'h-6 min-w-6 justify-center rounded-full px-1.5 text-label',
      'aria-[current=page]:bg-brand-primary',
      'aria-[current=page]:text-brand-primary-contrast',
    ],
    trigger: [
      'inline-flex shrink-0 items-center justify-center gap-1 rounded-full',
      'border border-border-strong bg-surface text-text',
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
