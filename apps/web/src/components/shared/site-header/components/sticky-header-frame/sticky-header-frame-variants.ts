import { tv } from 'tailwind-variants';

export const stickyHeaderFrameVariants = tv({
  // The frame, not `Header`, is what sticks — `Header`'s own `sticky` has no room to move inside it.
  base: ['sticky top-0 z-10'],
});
