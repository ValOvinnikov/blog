import { tv } from '@blog/ui/lib/styling';

export const mediaCardFooterVariants = tv({
  slots: {
    root: [
      'relative z-10 flex items-center gap-2',
      'pointer-events-none [&_a]:pointer-events-auto [&_button]:pointer-events-auto',
      'mt-auto pt-3',
      'font-mono text-xs',
    ],
    topic: [
      'inline-flex items-center gap-1 leading-none',
      'text-brand-primary lowercase',
    ],
  },
});
