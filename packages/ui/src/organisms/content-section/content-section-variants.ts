import { tv } from 'tailwind-variants';

export const contentSectionVariants = tv({
  slots: {
    root: 'mt-[22px]',
    heading: [
      'font-mono text-label font-normal uppercase tracking-label text-text-subtle',
      'm-0 mb-3',
    ],
  },
});
