import { tv } from 'tailwind-variants';

export const basicTextRendererVariants = tv({
  slots: {
    bulletList: ['list-disc space-y-1 pl-5 marker:text-brand-primary'],
    numberList: ['list-decimal space-y-1 pl-5 marker:text-brand-primary'],
  },
});
