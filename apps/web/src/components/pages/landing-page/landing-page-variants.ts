import { tv } from 'tailwind-variants';

export const landingPageVariants = tv({
  slots: {
    layout: [
      'mx-auto w-full max-w-page px-gutter',
      'lg:grid lg:grid-cols-[220px_1fr] lg:gap-x-10',
    ],
    sidebar: ['lg:col-start-1'],
    content: ['min-w-0', 'lg:col-start-2'],
  },
});
