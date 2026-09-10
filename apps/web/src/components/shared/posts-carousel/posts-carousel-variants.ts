import { tv } from 'tailwind-variants';

export const postsCarouselVariants = tv({
  slots: {
    slide: [
      'basis-[85%]',
      'sm:basis-[calc(50%-0.4375rem)]',
      'md:basis-[calc(33.333%-0.8333rem)]',
    ],
  },
});
