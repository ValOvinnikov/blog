import { tv } from '@blog/ui/lib/styling';

export const mediaCardTitleVariants = tv({
  base: [
    'group-hover:text-brand-primary group-focus-within:text-brand-primary',
    'transition-colors duration-base ease-smooth motion-reduce:transition-none',
  ],
  variants: {
    isLead: {
      true: [],
      false: ['line-clamp-4', '@2xs:text-lg'],
    },
  },
  defaultVariants: {
    isLead: false,
  },
});
