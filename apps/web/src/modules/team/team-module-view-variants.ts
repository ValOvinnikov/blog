import { tv } from 'tailwind-variants';

export const teamModuleViewVariants = tv({
  slots: {
    grid: ['md:grid-cols-2'],
  },
  variants: {
    columns: {
      1: {},
      2: {},
      3: { grid: ['lg:grid-cols-3'] },
      4: { grid: ['lg:grid-cols-4'] },
    },
  },
});
