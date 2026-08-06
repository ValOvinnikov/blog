import { tv } from '@blog/ui/lib/styling';

export const spinnerVariants = tv({
  slots: {
    root: ['inline-flex items-center gap-[0.7ch]', 'font-mono', 'text-accent'],
    glyph: [
      'inline-block',
      "before:inline-block before:w-[1ch] before:text-center before:content-['⠋']",
      'before:animate-[spin-dots_0.9s_infinite]',
      "motion-reduce:before:content-['⠿'] motion-reduce:before:animate-none",
    ],
    text: ['text-copy'],
  },
});
