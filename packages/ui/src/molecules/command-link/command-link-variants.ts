import { tv } from '@blog/ui/lib/styling';

export const commandLinkVariants = tv({
  slots: {
    root: [
      'group inline-flex items-center gap-1.5 no-underline',
      'font-mono text-copy',
      'transition-colors duration-base ease-console',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
      'focus-visible:ring-offset-2 focus-visible:ring-offset-bg',
    ],
    prompt: ['select-none text-subtle'],
    command: [
      'text-accent underline underline-offset-[3px] decoration-1',
      'group-hover:text-accent-hover group-hover:decoration-accent',
    ],
    arrow: [
      'text-accent opacity-60',
      'transition-transform duration-base ease-console',
      'group-hover:translate-x-0.5',
    ],
    cursor: [
      'inline-block h-[1em] w-[0.5ch]',
      'bg-accent',
      'animate-[blink_1s_steps(1)_infinite]',
    ],
  },
});
