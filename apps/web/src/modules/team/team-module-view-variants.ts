import { tv } from 'tailwind-variants';

export const teamModuleViewVariants = tv({
  slots: {
    grid: ['md:grid-cols-2'],
    item: [],
  },
  variants: {
    columns: {
      1: {},
      2: {},
      3: { grid: ['lg:grid-cols-3'] },
      4: { grid: ['lg:grid-cols-4'] },
    },
    isLoneFromLg: { true: {}, false: {} },
  },
  compoundVariants: [
    { columns: 3, isLoneFromLg: true, class: { item: ['lg:col-start-2'] } },
  ],
  defaultVariants: { isLoneFromLg: false },
});
