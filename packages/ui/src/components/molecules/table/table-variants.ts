import { tv } from '@blog/ui/lib/styling';

export const tableVariants = tv({
  slots: {
    region: ['w-full overflow-x-auto overscroll-x-contain'],
    table: [
      'w-full border-collapse',
      'text-left text-sm leading-normal text-text',
    ],
  },
});
