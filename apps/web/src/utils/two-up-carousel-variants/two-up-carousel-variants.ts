import { tv } from 'tailwind-variants';

export const twoUpCarouselVariants = tv({
  base: ['md:[&>div>ul>li]:basis-1/2', 'lg:[&>div>ul>li]:basis-1/3'],
});
