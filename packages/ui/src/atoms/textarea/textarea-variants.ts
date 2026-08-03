import { tv } from '@blog/ui/lib/styling';

export const textareaVariants = tv({
  slots: {
    root: ['relative w-full'],
    prompt: [
      'pointer-events-none absolute top-2 left-3',
      'font-mono text-copy text-accent select-none',
    ],
    textarea: [
      'w-full rounded-sm border bg-surface px-3 py-2',
      'font-body text-copy text-text placeholder:text-subtle',
      'transition-colors duration-base ease-console',
      'border-border-strong',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
      'disabled:pointer-events-none disabled:opacity-50',
    ],
  },
  variants: {
    invalid: {
      true: { textarea: ['border-danger text-danger'] },
    },
    hasPrompt: {
      true: { textarea: ['pl-8'] },
    },
  },
});
