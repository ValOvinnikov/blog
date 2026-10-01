import { tv } from 'tailwind-variants';

export const testimonialModuleViewVariants = tv({
  slots: {
    grid: ['sm:grid-cols-4 md:grid-cols-4'],
    item: ['sm:col-span-2'],
  },
  variants: {
    columns: {
      2: { grid: ['lg:grid-cols-4'] },
      3: { grid: ['lg:grid-cols-6'] },
    },
    isLoneBelowLg: { true: {}, false: {} },
    isLoneFromLg: { true: {}, false: {} },
  },
  compoundVariants: [
    { columns: 2, isLoneBelowLg: true, class: { item: ['sm:col-start-2'] } },
    {
      columns: 3,
      isLoneBelowLg: true,
      class: { item: ['sm:max-lg:col-start-2'] },
    },
    { columns: 3, isLoneFromLg: true, class: { item: ['lg:col-start-3'] } },
  ],
  defaultVariants: { isLoneBelowLg: false, isLoneFromLg: false },
});
