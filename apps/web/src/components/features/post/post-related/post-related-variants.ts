import { tv } from 'tailwind-variants';

export const postRelatedVariants = tv({
  slots: {
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    grid: ['gap-3.5 md:gap-5 lg:gap-7'],
  },
});
