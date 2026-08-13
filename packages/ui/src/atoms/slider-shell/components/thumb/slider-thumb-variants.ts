import { tv } from '@blog/ui/lib/styling';

export const sliderThumbVariants = tv({
  base: [
    'absolute top-1/2 -translate-y-1/2',
    'h-4 w-4 cursor-grab rounded-full border-2 border-surface bg-brand-primary-solid shadow-sm',
    'transition-transform duration-fast ease-console',
    'data-[dragging]:scale-110 data-[dragging]:cursor-grabbing',
    'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-primary',
  ],
});
