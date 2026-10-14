import { tv } from 'tailwind-variants';

export const teamModuleViewVariants = tv({
  slots: {
    gridContainer: ['@container'],
    grid: ['@xl:grid-cols-2'],
    item: [],
  },
  variants: {
    columns: {
      1: {},
      2: {},
      3: { grid: ['@2xl:grid-cols-3'] },
      4: { grid: ['@2xl:grid-cols-3 @4xl:grid-cols-4'] },
    },
    isLoneInRowOfThree: { true: {}, false: {} },
  },
  compoundVariants: [
    {
      columns: [3, 4],
      isLoneInRowOfThree: true,
      class: { item: ['@2xl:col-start-2'] },
    },
    {
      columns: 4,
      isLoneInRowOfThree: true,
      class: { item: ['@4xl:col-start-auto'] },
    },
  ],
  defaultVariants: { isLoneInRowOfThree: false },
});
