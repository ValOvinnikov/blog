import { tv } from '@blog/ui/lib/styling';

export const ctaModuleVariants = tv({
  slots: {
    root: [
      'flex flex-col items-start gap-3',
      'mt-[22px] px-gutter py-section',
      'bg-subtle',
    ],
    heading: ['m-0'],
    text: ['m-0', 'max-w-prose', 'text-subtle'],
    action: ['mt-2'],
  },
});
