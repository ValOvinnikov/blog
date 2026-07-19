import { tv } from '@blog/ui/lib/styling';

export const terminalChipVariants = tv({
  slots: {
    root: [
      'inline-flex items-center gap-1.5',
      'rounded-sm border border-border-strong px-2.5 py-1',
      'bg-surface',
      'font-mono text-label',
    ],
    prompt: ['text-accent'],
    text: ['text-text'],
    cursor: [
      'inline-block h-[1em] w-[0.5ch]',
      'bg-accent',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
  },
});
