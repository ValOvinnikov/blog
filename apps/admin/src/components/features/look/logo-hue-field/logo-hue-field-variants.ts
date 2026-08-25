import { tv } from 'tailwind-variants';

export const logoHueFieldVariants = tv({
  slots: {
    root: ['flex w-full flex-col gap-3'],
    switchRow: ['flex items-center gap-2.5 text-sm text-text'],
    switchTrack: [
      'relative h-5 w-9 shrink-0 cursor-pointer rounded-full bg-secondary',
      'transition-colors duration-base ease-console',
      'data-[checked]:bg-brand-primary-solid',
      'outline-hidden focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
    ],
    switchThumb: [
      'absolute left-0.5 top-0.5 size-4 rounded-full bg-surface shadow',
      'transition-transform duration-base ease-console',
      'data-[checked]:translate-x-4',
    ],
    hueField: ['flex items-center gap-3'],
    tones: ['flex h-8 w-8 shrink-0 overflow-hidden rounded-md'],
    tone: ['h-full w-1/3'],
    hueValue: ['w-28 shrink-0 font-mono text-meta text-text-subtle'],
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
