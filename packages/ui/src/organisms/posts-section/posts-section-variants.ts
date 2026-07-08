import { tv } from 'tailwind-variants';

export const postsSectionVariants = tv({
  slots: {
    root: 'mt-[22px]',
    label: [
      'font-mono text-label font-normal uppercase tracking-label text-subtle',
      'm-0 mb-3',
    ],
    grid: ['grid', 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3', 'gap-3.5'],
    titleLink: 'before:absolute before:inset-0',
  },
});
