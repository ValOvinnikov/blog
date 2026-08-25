import { tv } from 'tailwind-variants';

export const hueSliderVariants = tv({
  slots: {
    root: ['min-w-40 flex-1 touch-none select-none'],
    control: ['flex items-center py-2'],
    track: [
      'relative h-3 w-full grow rounded-full',
      'ring-1 ring-inset ring-border',
      'data-[disabled]:opacity-50',
    ],
    thumb: [
      'block size-5 rounded-full border-2 border-border-strong bg-surface shadow',
      'outline-hidden transition-colors duration-base ease-console',
      'focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
      'data-[dragging]:border-brand-primary',
    ],
  },
});
