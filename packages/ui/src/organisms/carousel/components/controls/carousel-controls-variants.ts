import { tv } from '@blog/ui/lib/styling';

export const carouselControlsVariants = tv({
  slots: {
    root: ['flex items-center justify-center', 'gap-3 mt-5'],
    previousIcon: ['rotate-180'],
  },
});
