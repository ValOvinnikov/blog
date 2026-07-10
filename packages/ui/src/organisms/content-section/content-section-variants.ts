import { tv } from '@blog/ui/lib/styling';

export const contentSectionVariants = tv({
  slots: {
    root: 'mt-[22px]',
    heading: [
      'font-mono text-label font-normal uppercase tracking-label text-text-subtle',
      'm-0 mb-3',
    ],
  },
});
