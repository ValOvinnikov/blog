import { tv } from '@blog/ui/lib/styling';

export const terminalTypingVariants = tv({
  slots: {
    root: [
      'inline-flex items-baseline',
      'font-mono text-hero font-medium leading-[1.05] tracking-tight-hero',
      'text-text',
    ],
    cursor: [
      'inline-block h-[1em] w-[0.5ch]',
      'bg-accent',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
  },
});
