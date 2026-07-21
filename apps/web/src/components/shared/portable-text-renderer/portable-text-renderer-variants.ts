import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
    inlineCode: [
      'rounded bg-surface-2 px-1.5 py-0.5',
      'font-mono text-code text-text',
    ],
  },
});
