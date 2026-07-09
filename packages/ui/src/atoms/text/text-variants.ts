import { tv } from '@blog/ui/lib/tv';

export const textVariants = tv(
  {
    base: ['font-read'],
    variants: {
      variant: {
        lead: ['text-lead leading-[1.72]', 'text-text'],
        muted: ['text-lead leading-[1.72]', 'text-muted'],
        hero: ['text-base leading-[1.6]', 'text-muted'],
        card: ['text-card-copy leading-[1.55]', 'text-muted'],
      },
    },
    defaultVariants: { variant: 'lead' },
  },
  {
    twMergeConfig: {
      extend: {
        classGroups: {
          'font-size': [{ text: ['lead', 'card-copy'] }],
        },
      },
    },
  },
);
