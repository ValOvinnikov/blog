import { tv } from '@blog/ui/lib/styling';

export const textInputVariants = tv({
  slots: {
    root: ['relative w-full'],
    prompt: [
      'pointer-events-none absolute inset-y-0 left-3 flex items-center',
      'font-mono text-copy text-accent select-none',
    ],
    input: [
      'w-full rounded-sm border bg-surface px-3 py-2',
      'font-mono text-copy text-text placeholder:text-subtle',
      'transition-colors duration-base ease-console',
      'border-border-strong',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
  },
  variants: {
    invalid: {
      true: { input: ['border-danger text-danger'] },
    },
    hasPrompt: {
      true: { input: ['pl-8'] },
    },
  },
});
