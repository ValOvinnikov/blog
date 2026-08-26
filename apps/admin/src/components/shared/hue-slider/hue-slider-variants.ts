import { tv } from 'tailwind-variants';

export const hueSliderVariants = tv({
  slots: {
    root: ['min-w-40 flex-1 touch-none select-none'],
    control: ['flex items-center py-2'],
    track: [
      'relative h-3 w-full grow rounded-full bg-admin-line-2',
      'data-[disabled]:opacity-50',
    ],
    thumb: [
      'block size-5 rounded-full bg-white',
      'shadow-[0_1px_4px_rgba(0,0,0,.35),inset_0_0_0_1px_rgba(0,0,0,.08)]',
      'outline-hidden transition-colors',
      'focus-visible:ring-2 focus-visible:ring-admin-brand focus-visible:ring-offset-2',
      'data-[dragging]:ring-2 data-[dragging]:ring-admin-brand',
    ],
  },
});
