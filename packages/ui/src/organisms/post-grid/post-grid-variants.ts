import { tv } from 'tailwind-variants';

export const postGridVariants = tv({
  base: [
    'grid',
    'grid-cols-[repeat(auto-fit,minmax(200px,1fr))]',
    'gap-[14px]',
    'mt-4',
  ],
});
