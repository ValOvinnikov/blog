import { tv } from 'tailwind-variants';

export const headerVariants = tv({
  base: [
    'flex items-center justify-between',
    'w-full px-gutter py-3',
    'bg-bg border-b border-border',
    'sticky top-0 z-10',
  ],
});
