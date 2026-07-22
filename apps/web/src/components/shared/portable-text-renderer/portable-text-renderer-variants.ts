import { tv } from 'tailwind-variants';

export const portableTextRendererVariants = tv({
  slots: {
    root: ['[&>*+*]:mt-6'],
  },
});
