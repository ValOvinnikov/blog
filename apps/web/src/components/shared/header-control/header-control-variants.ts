import { HEADER_CONTROL, tv } from '@blog/ui/lib/styling';

export const headerControlVariants = tv({
  base: [
    'inline-flex shrink-0 items-center justify-center gap-1',
    HEADER_CONTROL,
  ],
  variants: {
    shape: {
      square: ['size-11 px-0 lg:size-9 pointer-coarse:size-11'],
      label: [
        'size-auto min-h-11 px-4 py-0 lg:min-h-9 pointer-coarse:min-h-11',
      ],
    },
  },
  defaultVariants: { shape: 'label' },
});
